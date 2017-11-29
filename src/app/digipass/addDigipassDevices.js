const storage = require('../../infrastructure/deviceStorage/index');

const action = async (req, res) => {
  const devices = req.body.devices;
  if (!devices || devices.length === 0) {
    return res.status(400).contentType('json').send(JSON.stringify({
      message: 'devices must be supplied',
    }));
  }
  if (!(devices instanceof Array)) {
    return res.status(400).contentType('json').send(JSON.stringify({
      message: 'devices must be an Array',
    }));
  }

  await Promise.all(devices.map((device) => {
    return storage.storeDigipassDetails({
      serialNumber: device.serialNumber,
      secret: device.secret,
      counterPosition: device.counter,
      codeLength: 8,
    });
  }));

  res.status(202).send();
};

module.exports = action;