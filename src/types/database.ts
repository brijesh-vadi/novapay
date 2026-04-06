export type TxStatus = 'initiated' | 'pending_approval' | 'approved' | 'processing' | 'completed' | 'failed' | 'reversed' | 'expired';
export type TxType = 'payment' | 'refund' | 'payout' | 'transfer' | 'fee_collection' | 'settlement';
export type CurrencyCode = 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED' | 'INR' | 'JPY' | 'SGD';
export type ComplianceFlag = 'none' | 'aml_review' | 'sanctions_hit' | 'pep_match' | 'unusual_activity' | 'velocity_breach';
export type InvoiceStatus = 'draft' | 'sent' | 'viewed' | 'partially_paid' | 'paid' | 'overdue' | 'cancelled' | 'disputed';
export type WebhookEvent = 'payment.completed' | 'payment.failed' | 'invoice.created' | 'compliance.alert';
export interface Database { public: { Tables: Record<string, any>; Functions: Record<string, any>; }; }
