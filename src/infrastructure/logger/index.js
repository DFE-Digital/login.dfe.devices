'use strict';

// eslint-disable-next-line no-unused-expressions
const winston = require('winston');
const config = require('./../config');
const appInsights = require('applicationinsights');
const AppInsightsTransport = require('login.dfe.winston-appinsights');

// const logLevel = (config && config.loggerSettings && config.loggerSettings.logLevel) ? config.loggerSettings.logLevel : 'info';

const customLevels = {
    levels: {
        audit: 0,
        error: 1,
        warn: 2,
        info: 3,
        verbose: 4,
        debug: 5,
        silly: 6,
    },
    colors: {
        info: 'yellow',
        ok: 'green',
        error: 'red',
        audit: 'magenta',
    },
};

const loggerConfig = {
    levels: customLevels.levels,
  transports: [],
};

// loggerConfig.transports.push(new winston.transports.Console({level: logLevel, colorize: true}));
if (config && config.loggerSettings && config.loggerSettings.redis && config.loggerSettings.redis.enabled) {
  loggerConfig.transports.push(new winston.transports.Redis({
    level: 'audit',
    length: 4294967295,
    host: config.loggerSettings.redis.host,
    port: config.loggerSettings.redis.port,
    auth: config.loggerSettings.redis.auth,
  }));
}

if (config.hostingEnvironment.applicationInsights) {
  appInsights.setup(config.hostingEnvironment.applicationInsights).setAutoCollectConsole(false, false).start();
  loggerConfig.transports.push(new AppInsightsTransport({
    client: appInsights.defaultClient,
    applicationName: config.loggerSettings.applicationName || 'Devices',
    type: 'event',
    treatErrorsAsExceptions: true,
  }));
}

const logger = winston.createLogger(loggerConfig);

process.on('unhandledRejection', (reason, p) => {
  logger.error('Unhandled Rejection at:', p, 'reason:', reason);
});

module.exports = logger;
