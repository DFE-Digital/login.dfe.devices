const Redis = require('ioredis');
const config = require('./../config');

const client = new Redis(config.devices.storage.params.connectionString);

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

const getDigipassDetails = async (serialNumber) => {
  const key = `Digipass_${serialNumber}`;
  const data = await get(key);
  if (!data) {
    return null;
  }

  return JSON.parse(data);
};
const storeDigipassDetails = async ({ serialNumber, secret, counterPosition, codeLength }) => {
  const key = `Digipass_${serialNumber}`;
  const value = JSON.stringify({ serialNumber, secret, counterPosition, codeLength });

  await set(key, value);
};

module.exports = {
  getDigipassDetails,
  storeDigipassDetails,
};