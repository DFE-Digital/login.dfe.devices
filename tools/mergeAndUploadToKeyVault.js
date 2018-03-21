const fs = require('fs');
const { join: pathJoin } = require('path');
const { promisify } = require('util');
const { flatten, tail } = require('lodash');
const KeyVault = require('azure-keyvault');
const { AuthenticationContext } = require('adal-node');
const pkcsParser = require('./../src/app/digipass/pkcsParser');

const readFile = promisify(fs.readFile);
const writeFile = promisify(fs.writeFile);
const stats = promisify(fs.stat);

const fileExists = async (path) => {
  try {
    await stats(path);
    return true;
  } catch (e) {
    return false;
  }
};
const loadSettings = async () => {
  const path = pathJoin(__dirname, 'settings.json');
  if (!await fileExists(path)) {
    throw new Error(`Cannot find settings file at ${path}`);
  }

  const json = await readFile(path, 'utf8');
  const settings = JSON.parse(json);
  if (settings.filters) {
    settings.filters = settings.filters.map((filter) => new RegExp(filter));
  }
  return settings;
};


const readAndUnpackPkcsFiles = async (pkcsFileDetails) => {
  const results = await Promise.all(pkcsFileDetails.map(async (details) => {
    const xml = await readFile(details.path, 'utf8');
    return pkcsParser.parser(xml, details.key);
  }));
  return flatten(results);
};
const readAndUnpackUnlockFile = async (unlockFilePaths) => {
  const results = await Promise.all(unlockFilePaths.map(async (unlockPath) => {
    const csv = await readFile(unlockPath, 'utf8');
    const rows = tail(csv.split(/\r?\n/));
    return rows.map((row) => {
      const cols = row.split(',');
      return {
        serialNumber: cols[0],
        unlock1: cols[2],
        unlock2: cols[3],
      };
    }).filter(x => x.serialNumber);
  }));
  return flatten(results);
};

const ensureUnlockCodeCorrectLength = (unlockCode) => {
  let paddedCode = unlockCode;
  while (paddedCode.length < 8) {
    paddedCode = `0${paddedCode}`;
  }
  return paddedCode;
};
const deviceInFilters = (serialNumber, filters) => {
  if (!filters || filters.length === 0) {
    return true;
  }

  let inFilters = false;
  for (let i = 0; i < filters.length && !inFilters; i += 1) {
    inFilters = filters[i].test(serialNumber);
  }
  return inFilters;
};
const prepareItemsForQueue = (devices, unlockCodes, filters) => {
  return devices.map((device) => {
    if (!deviceInFilters(device.serialNumber, filters)) {
      return null;
    }
    const deviceUnlockCodes = unlockCodes.filter(x => x.serialNumber === device.serialNumber);
    const deviceForStore = {
      serialNumber: device.serialNumber,
      secret: device.secret,
      counterPosition: device.counter,
      codeLength: 8,
      unlock1: '',
      unlock2: '',
      deactivated: false,
      deactivatedReason: '',
    };
    if (deviceUnlockCodes && deviceUnlockCodes.length > 0) {
      deviceForStore.unlock1 = ensureUnlockCodeCorrectLength(deviceUnlockCodes[0].unlock1);
      deviceForStore.unlock2 = ensureUnlockCodeCorrectLength(deviceUnlockCodes[0].unlock2);
    }
    return {
      attempts: 0,
      device: deviceForStore,
    };
  }).filter(x => x !== null);
};
const getKeyVaultClient = (settings) => {
  const clientId = settings.keyVault.clientId;
  const clientSecret = settings.keyVault.clientSecret;

  const credentials = new KeyVault.KeyVaultCredentials((challenge, callback) => {
    const context = new AuthenticationContext(challenge.authorization);

    return context.acquireTokenWithClientCredentials(challenge.resource, clientId, clientSecret, (err, tokenResponse) => {
      if (err) throw err;

      const authorizationValue = `${tokenResponse.tokenType} ${tokenResponse.accessToken}`;

      return callback(null, authorizationValue);
    });
  });
  return new KeyVault.KeyVaultClient(credentials);
};
const uploadDevice = async (device, kvClient, settings) => {
  const key = `Digipass-${device.serialNumber}`;

  let existing;
  try {
    existing = await kvClient.getSecret(`${settings.keyVault.uri}secrets/${key}`);
  } catch (e) {
    if (e.code !== 'SecretNotFound') {
      throw e;
    }
  }
  if (existing && settings.overwriteHandling.toLowerCase() === 'skip') {
    const e = new Error('Skipped as device already exists in key-vault');
    e.dontRetry = true;
    throw e;
  }

  let toUpload = device;
  if (existing && settings.overwriteHandling.toLowerCase() === 'upsert') {
    const upserted = JSON.parse(existing.value);
    upserted.unlock1 = device.unlock1;
    upserted.unlock2 = device.unlock2;
    toUpload = upserted;
  }

  const value = JSON.stringify(toUpload);
  console.info(`Uploading ${toUpload.serialNumber}`);
  await kvClient.setSecret(settings.keyVault.uri, key, value);
};
const process = async (devices, unlockCodes, settings) => {
  const kvClient = getKeyVaultClient(settings);
  const queue = prepareItemsForQueue(devices, unlockCodes, settings.filters);
  const failedSerialNumbers = [];
  while (queue.length > 0) {
    const next = queue.shift();
    try {
      await uploadDevice(next.device, kvClient, settings);

      if (!next.device.unlock1 || next.device.unlock1.trim().length === 0) {
        failedSerialNumbers.push({
          serialNumber: next.device.serialNumber,
          reason: 'Missing unlock codes',
        });
      }
    } catch (e) {
      next.attempts++;
      console.warn(`Error uploading ${next.device.serialNumber} on attempt ${next.attempts}: ${e.message}`);
      if (e.dontRetry || next.attempts >= settings.queue.retryAttempts) {
        failedSerialNumbers.push({
          serialNumber: next.device.serialNumber,
          reason: e.message,
        });
      } else {
        queue.push(next);
      }
    }
  }
  return failedSerialNumbers;
};
const writeFailures = async (failed, settings) => {
  const contents = JSON.stringify(failed);
  await writeFile(settings.failurePath, contents, 'utf8');
  return settings.failurePath;
};


const run = async () => {
  const settings = await loadSettings();
  const devices = await readAndUnpackPkcsFiles(settings.pkcsFiles);
  const unlockCodes = await readAndUnpackUnlockFile(settings.unlockFiles);

  const failed = await process(devices, unlockCodes, settings);
  let failedPath = null;
  if (failed.length > 0) {
    failedPath = await writeFailures(failed, settings);
  }
  return failedPath;
};

run().then((failedPath) => {
  if (failedPath) {
    console.info(`Completed with failures. Failures saved to ${failedPath}`);
  } else {
    console.info('Completed without failure');
  }
}).catch((e) => {
  console.error(e);
});
