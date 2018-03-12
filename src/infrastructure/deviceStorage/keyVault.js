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
  try {
    logger.info(`keyVault - getDigipassDetails for serialNumber: ${serialNumber} for request ${correlationId}`, { correlationId });
    const uri = `${keyVaultUri}secrets/Digipass-${serialNumber}`;
    const secret = await client.getSecret(uri);
    if (!secret) {
      return null;
    }
    return JSON.parse(secret.value);
  } catch (e) {
    const statusCode = e.statusCode ? e.statusCode : 500;
    if (statusCode === 404) {
      return null;
    }
    throw e;
  }
};
const storeDigipassDetails = async ({ serialNumber, secret, counterPosition, codeLength, unlock1, unlock2, deactivated = false, deactivatedReason = '' }, correlationId) => {
  logger.info(`keyVault - storeDigipassDetails for serialNumber: ${serialNumber} for request ${correlationId}`, { correlationId });
  const key = `Digipass-${serialNumber}`;
  const value = JSON.stringify({ serialNumber, secret, counterPosition, codeLength, unlock1, unlock2, deactivated, deactivatedReason });
  await client.setSecret(keyVaultUri, key, value);
};

const getAllDigipass = async (correlationId) => {
  logger.info(`keyVault - getAllDigipass for request ${correlationId}`, { correlationId });
  const pageLink = keyVaultUri.slice(0, -1);
  const digiPassTokens = await client.getSecrets(pageLink);

  let moreRecords = true;
  let nextLink = digiPassTokens.nextLink;

  while (moreRecords) {
    const tokensPage = await client.getSecretsNext(nextLink);

    if (tokensPage.length === 0) {
      moreRecords = false;
    }

    const tokensToAdd = tokensPage.filter(token => token.id.indexOf('secrets/Digipass-undefined') === -1);

    digiPassTokens.push(...tokensToAdd);

    nextLink = tokensPage.nextLink;
    if (!nextLink) {
      moreRecords = false;
    }
  }

  return digiPassTokens.filter(token => token.id.indexOf('secrets/Digipass-') !== -1).map(token => ({ serialNumber: token.id.replace(`${keyVaultUri}secrets/Digipass-`, '') }));
};

module.exports = {
  getDigipassDetails,
  storeDigipassDetails,
  getAllDigipass,
};
