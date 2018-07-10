'user strict';

const logger = require('./../../infrastructure/logger');
const { list } = require('./../../infrastructure/cache');

const getAllDevices = async (req, res) => {
  const correlationId = req.header('x-correlation-id');
  logger.info(`Getting digipass list from cache for request ${correlationId}`, { correlationId });

  const cacheEntry = list('digipass');
  if (!cacheEntry.lastUpdated) {
    return res.status(503).set('Retry-After', 30).send();
  }

  res.send(cacheEntry.data);
};

module.exports = getAllDevices;
