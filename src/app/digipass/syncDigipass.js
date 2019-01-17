const storage = require('../../infrastructure/deviceStorage/index');
const { hotp } = require('speakeasy');
const config = require('./../../infrastructure/config');

const syncWindowSize = config.digipass.syncWindow || 2000;

const action = async (req, res) => {
  const serialNumber = req.params.serial_number;
  const code1 = req.body.code1 ? req.body.code1.toString() : undefined;
  const code2 = req.body.code2 ? req.body.code2.toString() : undefined;
  if (!code1 || !code2) {
    return res.status(400).contentType('json').send(JSON.stringify({
      message: 'code1 and code2 must be supplied',
    }));
  }

  const deviceDetails = await storage.getDigipassDetails(serialNumber, req.header('x-correlation-id'));
  if (!deviceDetails) {
    return res.status(404).contentType('json').send(JSON.stringify({
      message: `No digipass device found with serial number ${serialNumber}`,
    }));
  }

  let valid = false;
  let code1Index = -1;
  for (let i = deviceDetails.counterPosition; i < deviceDetails.counterPosition + syncWindowSize; i += 1) {
    const token = hotp({
      secret: deviceDetails.secret,
      encoding: 'base32',
      counter: i,
      digits: deviceDetails.codeLength,
    });

    if (code1Index === -1 && token === code1) {
      code1Index = i;
    } else if (code1Index !== -1 && token === code2) {
      valid = true;
      break;
    } else if (code1Index !== -1) {
      code1Index = -1;
    }
  }

  if (valid) {
    await storage.storeDigipassDetails({
      serialNumber: deviceDetails.serialNumber,
      counterPosition: code1Index + 2,
      secret: deviceDetails.secret,
      codeLength: deviceDetails.codeLength,
    }, req.header('x-correlation-id'));
  }

  return res.contentType('json').send(JSON.stringify({
    valid,
  }));
};

module.exports = action;
