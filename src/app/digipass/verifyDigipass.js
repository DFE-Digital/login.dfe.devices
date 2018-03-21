const storage = require('../../infrastructure/deviceStorage');
const { hotp } = require('speakeasy');
const logger = require('./../../infrastructure/logger');

const action = async (req, res) => {
  const serialNumber = req.params.serial_number;
  const code = req.body.code;
  if (!code) {
    return res.status(400).contentType('json').send(JSON.stringify({
      message: 'code must be supplied',
    }));
  }

  const deviceDetails = await storage.getDigipassDetails(serialNumber, req.header('x-correlation-id'));
  if (!deviceDetails) {
    return res.status(404).contentType('json').send(JSON.stringify({
      message: `No digipass device found with serial number ${serialNumber}`,
    }));
  }

  if (deviceDetails.deactivated) {
    const correlationId = req.header('x-correlation-id');
    logger.warn(`Attempted to verify deactivated token with serialNumber: ${serialNumber} for request ${correlationId}`, { correlationId });
    return res.contentType('json').send(JSON.stringify({
      valid: false,
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
    const updatedDeviceDetails = Object.assign(deviceDetails, {
      counterPosition: deviceDetails.counterPosition + delta.delta + 1,
    });
    await storage.storeDigipassDetails(updatedDeviceDetails, req.header('x-correlation-id'));
  }

  return res.contentType('json').send(JSON.stringify({
    valid,
  }));
};

module.exports = action;
