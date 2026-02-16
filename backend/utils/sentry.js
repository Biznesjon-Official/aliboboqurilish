const Sentry = require('@sentry/node');

const initSentry = () => {
  if (process.env.SENTRY_DSN) {
    Sentry.init({
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV,
      tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
      integrations: [
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({
          request: true,
          serverName: true,
          transaction: true,
          user: true,
          version: true
        })
      ]
    });
  }
};

const getSentryMiddleware = () => {
  if (process.env.SENTRY_DSN) {
    return [
      Sentry.Handlers.requestHandler(),
      Sentry.Handlers.errorHandler()
    ];
  }
  return [];
};

module.exports = {
  initSentry,
  getSentryMiddleware,
  Sentry
};
