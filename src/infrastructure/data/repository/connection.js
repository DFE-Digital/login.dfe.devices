const Sequelize = require('sequelize').default;
const assert = require('assert');
const config = require('./../../config');

const Op = Sequelize.Op;

const getIntValueOrDefault = (value, defaultValue = 0) => {
  if (!value) {
    return defaultValue;
  }
  const int = parseInt(value);
  return isNaN(int) ? defaultValue : int;
};

const makeConnection = () => {
  if (config.storage && config.storage.postgresUrl) {
    return new Sequelize(config.storage.postgresUrl);
  }

  assert(config.storage.username, 'Database property username must be supplied');
  assert(config.storage.password, 'Database property password must be supplied');
  assert(config.storage.host, 'Database property host must be supplied');
  assert(config.storage.dialect, 'Database property dialect must be supplied, this must be postgres or mssql');


  const databaseName = config.storage.name || 'postgres';
  const encryptDb = config.storage.encrypt || false;
  const dbOpts = {
    retry: {
      match: [
        /SequelizeConnectionError/,
        /SequelizeConnectionRefusedError/,
        /SequelizeHostNotFoundError/,
        /SequelizeHostNotReachableError/,
        /SequelizeInvalidConnectionError/,
        /SequelizeConnectionTimedOutError/,
        /TimeoutError/,
      ],
      name: 'query',
      backoffBase: 100,
      backoffExponent: 1.1,
      timeout: 60000,
      max: 5,
    },
    host: config.storage.host,
    dialect: config.storage.dialect,
    operatorsAliases: Op,
    dialectOptions: {
      encrypt: encryptDb,
    },
    logging: false,
  };
  if (config.storage.pool) {
    dbOpts.pool = {
      max: getIntValueOrDefault(config.storage.pool.max, 5),
      min: getIntValueOrDefault(config.storage.pool.min, 0),
      acquire: getIntValueOrDefault(config.storage.pool.acquire, 10000),
      idle: getIntValueOrDefault(config.storage.pool.idle, 10000),
    };
  }

  return new Sequelize(databaseName, config.storage.username, config.storage.password, dbOpts);
};

module.exports = {
  makeConnection,
};