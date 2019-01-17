const mapDeviceEntity = require('./devices');

const mapArrayOfEntities = async (entities, mapper) => {
  if (!entities) {
    return [];
  }

  const results = new Array(entities.length);
  for (let i = 0; i < entities.length; i += 1) {
    results[i] = await mapper(entities[i]);
  }
  return results;
};

module.exports = {
  mapDeviceEntity,
  mapDeviceEntities: (entities) => mapArrayOfEntities(entities, mapDeviceEntity),
};
