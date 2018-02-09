const { getDigipassDetails } = require('./../../infrastructure/deviceStorage');

const checkDeviceExists = async (req, res) => {
  const deviceDetails = await getDigipassDetails(req.params.serial_number, req.header('x-correlation-id'));
  res.status(deviceDetails ? 204 : 404).send();
};

module.exports = checkDeviceExists;
