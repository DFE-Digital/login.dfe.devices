const storage = require('../../infrastructure/deviceStorage/index');
const { hotp } = require('speakeasy');

const action = async (req, res) => {
  const serialNumber = req.params.serial_number;
  const code = req.body.code;
  if (!code) {
    return res.status(400).contentType('json').send(JSON.stringify({
      message: 'code must be supplied',
    }));
  }

  const deviceDetails = await storage.getDigipassDetails(serialNumber);
  if (!deviceDetails) {
    return res.status(404).contentType('json').send(JSON.stringify({
      message: `No digipass device found with serial number ${serialNumber}`,
    }));
  }

  const delta = hotp.verifyDelta({
    secret: deviceDetails.secret,
    encoding: 'base32',
    counter: deviceDetails.counterPosition,
    digits: deviceDetails.codeLength,
    token: code.toString(),
    window: 10,
  });
  const valid = delta !== undefined;

  if (valid) {
    await storage.storeDigipassDetails({
      serialNumber: deviceDetails.serialNumber,
      counterPosition: deviceDetails.counterPosition + delta.delta,
      secret: deviceDetails.secret,
      codeLength: deviceDetails.codeLength,
    });
  }

  return res.contentType('json').send(JSON.stringify({
    valid,
  }));
};

module.exports = action;
