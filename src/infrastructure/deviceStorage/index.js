const config = require('./../config');

let storage;
const type = config.devices.storage.type;
if (type === 'static') {
  storage = require('./static');
} else if (type === 'redis') {
  storage = require('./redis');
} else if (type === 'keyvault') {
  storage = require('./keyVault');
} else {
  throw new Error(`unexpected device storage type '${type}'. Allowed types are static, redis or keyvault`);
}

module.exports = storage;