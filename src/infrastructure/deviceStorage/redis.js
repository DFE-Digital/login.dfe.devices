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

const getDigipassDetails = async (serialNumber) => {
  const key = `Digipass_${serialNumber}`;
  const data = await get(key);
  if (!data) {
    return null;
  }

  return JSON.parse(data);
};

module.exports = {
  getDigipassDetails,
};