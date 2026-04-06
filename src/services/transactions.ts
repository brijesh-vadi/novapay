import { supabase } from '../config/database';
import { Sentry } from '../config/sentry';

interface CreateTransactionInput {
  orgId: string;
  type: 'payment' | 'refund' | 'payout' | 'transfer';
  amount: number;
  currency: string;
  beneficiaryId?: string;
  initiatedBy: string;
  idempotencyKey?: string;
}

export async function createTransaction(input: CreateTransactionInput) {
  const { orgId, type, amount, currency, beneficiaryId, initiatedBy } = input;

  // Compliance screening
  if (beneficiaryId) {
    const screening = await screenBeneficiary(orgId, beneficiaryId);
    if (screening.flag !== 'none') {
      Sentry.captureException(
        new Error(`COMPLIANCE_BLOCK: ${screening.flag} for ${beneficiaryId}`)
      );
      return { error: `COMPLIANCE_BLOCK: ${screening.flag}`, data: null };
    }
  }

  const feeAmount = await calculateFee(orgId, amount);
  const referenceId = `TXN-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const { data, error } = await supabase.from('transactions').insert({
    org_id: orgId, reference_id: referenceId, type,
    status: 'initiated', amount, currency, fee_amount: feeAmount,
    beneficiary_id: beneficiaryId, initiated_by: initiatedBy,
  }).select().single();

  if (error) { Sentry.captureException(error); throw error; }

  const needsApproval = await checkApprovalRequired(orgId, amount);
  if (needsApproval) {
    await supabase.from('transactions').update({ status: 'pending_approval' }).eq('id', data.id);
  }

  return { data, isDuplicate: false };
}

// BUG: Returns duplicate rows for custom plans — see Linear NOV-5
export async function calculateMRR(orgId: string) {
  const { data, error } = await supabase.rpc('calculate_mrr', { p_org_id: orgId });
  if (error) throw error;
  return data;
}

async function screenBeneficiary(orgId: string, beneficiaryId: string) {
  const { data } = await supabase.from('compliance_screenings')
    .select('result, risk_score').eq('entity_id', beneficiaryId)
    .order('created_at', { ascending: false }).limit(1).single();
  return { flag: data?.result || 'none', score: data?.risk_score || 0 };
}

async function calculateFee(orgId: string, amount: number): Promise<number> {
  const { data: sub } = await supabase.from('subscriptions')
    .select('plan:plans(tx_fee_bps)').eq('org_id', orgId).eq('status', 'active').single();
  const bps = (sub?.plan as any)?.tx_fee_bps || 250;
  return Math.round((amount * bps) / 10000);
}

async function checkApprovalRequired(orgId: string, amount: number): Promise<boolean> {
  // TODO: Configurable thresholds per org — see Linear NOV-6
  return amount > 100000;
}
