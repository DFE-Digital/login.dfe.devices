const { devices } = require('./repository');
const { Op } = require('sequelize');
const { mapDeviceEntity, mapDeviceEntities } = require('./mappers');
const uuid = require('uuid/v4');

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

const storeDevice = async (type, serialNumber, deactivated, deactivatedReason) => {
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
  if (entity) {
    entity.deactivated = deactivated || false;
    entity.deactivatedReason = deactivatedReason || null;
    await entity.save();
    return entity.id;
  }

  const id = uuid();
  await devices.create({
    id,
    type,
    serialNumber,
    deactivated: deactivated || false,
    deactivatedReason: deactivatedReason || null,
  });
  return id;
};

module.exports = {
  listDevices,
  getDeviceByTypeAndSerialNumber,
  storeDevice,
};
