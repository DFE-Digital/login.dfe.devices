'user strict';

const logger = require('./../../infrastructure/logger');
const { listDevices } = require('./../../infrastructure/data');

const getAllDevices = async (req, res) => {
  const correlationId = req.header('x-correlation-id');
  logger.info(`Getting digipass list of serial numbers for request ${correlationId}`, { correlationId });

  const serialNumbers = [];
  let pageNumber = 1;
  let numberOfPages;
  while (numberOfPages === undefined || (pageNumber <= numberOfPages)) {
    const page = await listDevices('digipass', pageNumber, 500);

    serialNumbers.push(...page.devices.map(d => ({
      serialNumber: d.serialNumber,
    })));
    pageNumber += 1;
    numberOfPages = page.numberOfPages;
  }
  return res.json(serialNumbers);
};

module.exports = getAllDevices;
