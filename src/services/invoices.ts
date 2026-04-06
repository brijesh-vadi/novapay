import { supabase } from '../config/database';
import { Sentry } from '../config/sentry';

export async function createInvoice(orgId: string, input: any) {
  const { data: invoiceNumber } = await supabase.rpc('generate_invoice_number', { p_org_id: orgId });
  const { data, error } = await supabase.from('invoices').insert({
    org_id: orgId, invoice_number: invoiceNumber,
    status: 'draft', ...input,
  }).select().single();
  if (error) { Sentry.captureException(error); throw error; }
  return data;
}

export async function getReceivablesAging(orgId: string) {
  return supabase.from('v_receivables_aging').select('*').eq('org_id', orgId);
}
