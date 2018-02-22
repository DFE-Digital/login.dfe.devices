const { getDigipassDetails } = require('./../../infrastructure/deviceStorage');

const checkDeviceExists = async (req, res) => {
  const deviceDetails = await getDigipassDetails(req.params.serial_number, req.header('x-correlation-id'));
  let filterdFields = {};
  if (deviceDetails && req.query.fields) {
    const fields = req.query.fields.split(',');
    filterdFields = Object.keys(deviceDetails)
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
