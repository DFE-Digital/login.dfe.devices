const { devices } = require('./repository');
const { Op } = require('sequelize');
const { mapDeviceEntity, mapDeviceEntities } = require('./mappers');

const listDevices = async (type, pageNumber, pageSize) => {
  const resultset = await devices.findAndCountAll({
    where: {
      type: {
        [Op.eq]: type,
      },
    },
    limit: pageSize,
    offset: (pageNumber - 1) * pageSize,
    order: ['type', 'serialNumber'],
  });
  const pageOfDevices = await mapDeviceEntities(resultset.rows);
  return {
    numberOfPages: Math.ceil(resultset.count / pageSize),
    devices: pageOfDevices,
  };
};

const getDeviceByTypeAndSerialNumber = async (type, serialNumber) => {
  const entity = await devices.find({
    where: {
      type: {
        [Op.eq]: type,
      },
      serialNumber: {
        [Op.eq]: serialNumber,
      },
    },
  });
  return mapDeviceEntity(entity);
};

module.exports = {
  listDevices,
  getDeviceByTypeAndSerialNumber,
};
