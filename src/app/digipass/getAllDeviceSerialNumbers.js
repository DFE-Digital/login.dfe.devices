'user strict';

const { getAllDigipass } = require('../../infrastructure/deviceStorage');

const getAllDevices = async (req, res) => {
  const devices = await getAllDigipass(req.header('x-correlation-id'));

  res.send(devices);
};

module.exports = getAllDevices;
