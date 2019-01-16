const { getDigipassDetails, storeDigipassDetails } = require('../../infrastructure/deviceStorage');
const { getDeviceByTypeAndSerialNumber } = require('../../infrastructure/data');
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

  const device = await getDeviceByTypeAndSerialNumber('digipass', serialNumber);
  if (!device) {
    return res.status(404).contentType('json').send(JSON.stringify({
      message: `No digipass device found with serial number ${serialNumber}`,
    }));
  }

  if (device.deactivated) {
    const correlationId = req.header('x-correlation-id');
    logger.warn(`Attempted to verify deactivated token with serialNumber: ${serialNumber} for request ${correlationId}`, { correlationId });
    return res.contentType('json').send(JSON.stringify({
      valid: false,
    }));
  }

  const deviceDetails = await getDigipassDetails(serialNumber, req.header('x-correlation-id'));
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
    window: 50,
  });
  const valid = delta !== undefined;

  if (valid) {
    const updatedDeviceDetails = Object.assign(deviceDetails, {
      counterPosition: deviceDetails.counterPosition + delta.delta + 1,
    });
    await storeDigipassDetails(updatedDeviceDetails, req.header('x-correlation-id'));
  }

  return res.contentType('json').send(JSON.stringify({
    valid,
  }));
};

module.exports = action;
