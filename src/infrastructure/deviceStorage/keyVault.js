const KeyVault = require('azure-keyvault');
const { AuthenticationContext } = require('adal-node');
const logger = require('./../logger');
const config = require('./../config');

const keyVaultUri = config.devices.storage.params.uri;
const clientId = config.devices.storage.params.clientId;
const clientSecret = config.devices.storage.params.clientSecret;

const credentials = new KeyVault.KeyVaultCredentials((challenge, callback) => {
  const context = new AuthenticationContext(challenge.authorization);

  return context.acquireTokenWithClientCredentials(challenge.resource, clientId, clientSecret, (err, tokenResponse) => {
    if (err) throw err;

    const authorizationValue = `${tokenResponse.tokenType} ${tokenResponse.accessToken}`;

    return callback(null, authorizationValue);
  });
});
const client = new KeyVault.KeyVaultClient(credentials);

const getDigipassDetails = async (serialNumber, correlationId) => {
  logger.info(`keyVault - getDigipassDetails for serialNumber: ${serialNumber} for request ${correlationId}`, { correlationId });
  const uri = `${keyVaultUri}secrets/Digipass-${serialNumber}`;
  const secret = await client.getSecret(uri);
  if (!secret) {
    return null;
  }
  return JSON.parse(secret.value);
};
const storeDigipassDetails = async ({ serialNumber, secret, counterPosition, codeLength }, correlationId) => {
  logger.info(`keyVault - storeDigipassDetails for serialNumber: ${serialNumber} for request ${correlationId}`, { correlationId });
  const key = `Digipass-${serialNumber}`;
  const value = JSON.stringify({ serialNumber, secret, counterPosition, codeLength });
  await client.setSecret(keyVaultUri, key, value);
};

module.exports = {
  getDigipassDetails,
  storeDigipassDetails,
};
