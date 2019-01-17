const { getDeviceByTypeAndSerialNumber } = require('./../../infrastructure/data');
const { getDigipassDetails } = require('./../../infrastructure/deviceStorage');

const checkDeviceExists = async (req, res) => {
  const deviceDetails = await getDeviceByTypeAndSerialNumber('digipass', req.params.serial_number);

  if (deviceDetails && req.query.fields) {
    const fields = req.query.fields.split(',');
    const sensitiveDetails = await getDigipassDetails(req.params.serial_number, req.header('x-correlation-id'));

    deviceDetails.unlock1 = sensitiveDetails.unlock1;
    deviceDetails.unlock2 = sensitiveDetails.unlock2;

    const filterdFields = Object.keys(deviceDetails)
      .filter(key => fields.includes(key))
      .reduce((obj, key) => {
        obj[key] = deviceDetails[key];
        return obj;
      }, {});

    return res.send(filterdFields);
  }

  return res.status(deviceDetails ? 204 : 404).send();
};

module.exports = checkDeviceExists;
