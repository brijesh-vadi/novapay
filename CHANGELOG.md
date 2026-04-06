# Changelog

## [2.0.0-alpha] - 2026-04-06

### Added
- Multi-currency support (8 currencies)
- Transaction approval workflow engine (NOV-6)
- Compliance screening (Dow Jones R&C)
- Sentry monitoring (novapay-2t)
- RLS on all 14 tables

### Known Issues
- calculate_mrr() duplicate rows (NOV-5)
- Compliance false positives (NOV-7)
- No webhook retry backoff (NOV-8)
- Missing RLS on webhook_deliveries (NOV-11)
