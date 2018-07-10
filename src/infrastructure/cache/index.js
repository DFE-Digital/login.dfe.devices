const logger = require('./../logger');
const { getAllDigipass } = require('./../deviceStorage');

const cache = {
  digipass: {
    data: [],
    lastUpdated: undefined,
  },
};
const availableTypes = Object.keys(cache);

const build = async () => {
  const correlationId = `devcache-${Date.now()}`;
  try {
    logger.info(`Starting to build cache with correlationid ${correlationId}`, { correlationId });

    cache.digipass.data = await getAllDigipass(correlationId);
    cache.digipass.lastUpdated = Date.now();

    logger.info(`Finished building cache with correlationid ${correlationId}`, { correlationId });
  } catch (e) {
    logger.error(`FATAL: failed to build cache with correlationid ${correlationId} - ${e.message} - process will exit`, { correlationId });
    process.exit(1);
  }
};

const list = (type) => {
  const selectedType = availableTypes.find(x => x.toLowerCase() === type.toLowerCase());
  if (!selectedType) {
    throw new Error(`Unknown cache type ${type}. Available types are ${availableTypes.join(', ')}`);
  }

  return cache[selectedType];
};

module.exports = {
  build,
  list,
};
