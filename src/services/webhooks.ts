import { supabase } from '../config/database';
import { Sentry } from '../config/sentry';

// BUG: No exponential backoff — see Linear NOV-8
export async function deliverWebhook(webhookId: string, event: string, payload: Record<string, unknown>) {
  const { data: webhook } = await supabase.from('webhooks')
    .select('url, secret_hash, is_active, failure_count').eq('id', webhookId).single();

  if (!webhook || !webhook.is_active) return;

  const startTime = Date.now();
  try {
    const response = await fetch(webhook.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-NovaPay-Event': event },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(30000),
    });

    await supabase.from('webhook_deliveries').insert({
      webhook_id: webhookId, event, payload,
      response_code: response.status, duration_ms: Date.now() - startTime,
      attempt_number: 1,
    });

    if (!response.ok) {
      Sentry.captureMessage(`Webhook failed: ${response.status}`, { level: 'warning' });
    }
  } catch (err) {
    Sentry.captureException(err, { tags: { webhook_id: webhookId, event } });
  }
}
