const { getDeviceByTypeAndSerialNumber, storeDevice } = require('../../infrastructure/data');

const action = async (req, res) => {
  const serialNumber = req.params.serial_number;
  const reason = req.body && req.body.reason ? req.body.reason : null;

  const device = await getDeviceByTypeAndSerialNumber('digipass', serialNumber);
  if (!device) {
    return res.status(404).contentType('json').send(JSON.stringify({
      message: `No digipass device found with serial number ${serialNumber}`,
    }));
  }

  await storeDevice(device.type, device.serialNumber, true, reason);

  return res.status(200).send();
};

module.exports = action;
