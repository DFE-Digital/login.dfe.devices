const storage = require('../../infrastructure/deviceStorage/index');

const action = async (req, res) => {
  const serialNumber = req.params.serial_number;

  const deviceDetails = await storage.getDigipassDetails(serialNumber, req.header('x-correlation-id'));
  if (!deviceDetails) {
    return res.status(404).contentType('json').send(JSON.stringify({
      message: `No digipass device found with serial number ${serialNumber}`,
    }));
  }

  deviceDetails.deactivated = true;

  if (req.body && req.body.reason) {
    deviceDetails.deactivatedReason = req.body.reason;
  }

  await storage.storeDigipassDetails(deviceDetails, req.header('x-correlation-id'));

  return res.status(200).send();
};

module.exports = action;
