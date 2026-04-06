import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/database';

export async function authenticateApiKey(req: Request, res: Response, next: NextFunction) {
  const apiKey = req.headers['x-novapay-key'] as string;
  if (!apiKey) return res.status(401).json({ error: 'Missing API key' });

  const prefix = apiKey.slice(0, 8);
  const { data: keyRecord } = await supabase.from('api_keys')
    .select('id, org_id, scopes, rate_limit_per_minute, is_active')
    .eq('key_prefix', prefix).eq('is_active', true).single();

  if (!keyRecord) return res.status(403).json({ error: 'Invalid API key' });

  await supabase.from('api_keys').update({ last_used_at: new Date().toISOString() }).eq('id', keyRecord.id);
  (req as any).orgId = keyRecord.org_id;
  (req as any).apiScopes = keyRecord.scopes;
  next();
}
