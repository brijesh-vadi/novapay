import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV || 'development',
  tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.2 : 1.0,
  beforeSend(event) {
    if (event.exception?.values?.[0]?.type === 'ComplianceScreeningBlock') {
      event.tags = { ...event.tags, compliance_flag: 'sanctions_hit' };
      event.level = 'fatal';
    }
    return event;
  },
});

export { Sentry };
