const mapDeviceEntity = async (entity) => {
  if (!entity) {
    return undefined;
  }

  return {
    id: entity.id,
    type: entity.type,
    serialNumber: entity.serialNumber,
    deactivated: entity.deactivated,
    deactivatedReason: entity.deactivatedReason,
  };
};
module.exports = mapDeviceEntity;