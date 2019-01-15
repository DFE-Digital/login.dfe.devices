const { listDevices } = require('./../../infrastructure/data');

const extractPageNumber = (req) => {
  const pageNumberString = req.query ? req.query.page : undefined;
  if (!pageNumberString) {
    return 1;
  }
  const pageNumber = parseInt(pageNumberString);
  if (isNaN(pageNumber)) {
    throw new Error('page must be a number');
  } else if (pageNumber < 1) {
    throw new Error('page must be at least 1');
  }
  return pageNumber;
};
const extractPageSize = (req) => {
  const pageSizeString = req.query ? req.query.pageSize : undefined;
  if (!pageSizeString) {
    return 25;
  }
  const pageSize = parseInt(pageSizeString);
  if (isNaN(pageSize)) {
    throw new Error('pageSize must be a number');
  } else if (pageSize < 1) {
    throw new Error('pageSize must be at least 1');
  } else if (pageSize > 500) {
    throw new Error('pageSize must be no more than 500');
  }
  return pageSize;
};

const list = async (req, res) => {
  let pageNumber;
  try {
    pageNumber = extractPageNumber(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }
  let pageSize;
  try {
    pageSize = extractPageSize(req);
  } catch (e) {
    return res.status(400).send(e.message);
  }

  const page = await listDevices('digipass', pageNumber, pageSize);
  return res.json({
    page: pageNumber,
    numberOfPages: page.numberOfPages,
    devices: page.devices,
  });
};
module.exports = list;
