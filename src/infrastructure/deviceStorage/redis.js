const Redis = require('ioredis');
const config = require('./../config');
const logger = require('./../logger');

const client = new Redis(config.devices.storage.params.connectionString);

const findAllKeys = async () => {
  const keys = [];
  return new Promise((resolve, reject) => {
    client.scanStream({
      match: 'Digipass_*',
    }).on('data', (resultKeys) => {
      for (let i = 0; i < resultKeys.length; i += 1) {
        keys.push(resultKeys[i]);
      }
    }).on('end', () => resolve(keys))
      .on('error', reject);
  });
};

const get = async (key) => {
  const result = await client.get(key);
  if (!result) {
    return null;
  }

  return result;
};
const set = async (key, value) => {
  await client.set(key, value);
};

const getDigipassDetails = async (serialNumber, correlationId) => {
  logger.info(`redis - getDigipassDetails for serialNumber: ${serialNumber} for request ${correlationId}`, { correlationId });
  const key = `Digipass_${serialNumber}`;
  const data = await get(key);
  if (!data) {
    return null;
  }

  return JSON.parse(data);
};
const storeDigipassDetails = async ({ serialNumber, secret, counterPosition, codeLength, unlock1, unlock2 }, correlationId) => {
  logger.info(`redis - storeDigipassDetails for serialNumber: ${serialNumber} for request ${correlationId}`, { correlationId });
  const key = `Digipass_${serialNumber}`;
  const value = JSON.stringify({ serialNumber, secret, counterPosition, codeLength, unlock1, unlock2 });

  await set(key, value);
};

const getAllDigipass = async (correlationId) => {
  logger.info(`redis - getting all keys for request ${correlationId}`, { correlationId });
  const keys = await findAllKeys();

  return keys.map(token => ({
    serialNumber: token.replace('Digipass_', ''),
  }));
};

module.exports = {
  getDigipassDetails,
  storeDigipassDetails,
  getAllDigipass,
};
