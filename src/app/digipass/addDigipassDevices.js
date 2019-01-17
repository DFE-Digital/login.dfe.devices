const storage = require('../../infrastructure/deviceStorage');
const data = require('../../infrastructure/data');

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

  const correlationId = req.header('x-correlation-id');
  for (let i = 0; i < devices.length; i += 1) {
    const device = devices[i];
    await storage.storeDigipassDetails({
      serialNumber: device.serialNumber,
      secret: device.secret,
      counterPosition: device.counter,
      codeLength: 8,
      unlock1: device.unlock1,
      unlock2: device.unlock2,
    }, correlationId);
    await data.storeDevice('digipass', device.serialNumber, undefined, undefined);
  }

  return res.status(202).send();
};

module.exports = action;
