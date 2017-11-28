const getDigipassDetails = (serialNumber) => {
  return {
    serialNumber,
    counterPosition: 0,
    secret: 'some-secret',
  };
};

module.exports = {
  getDigipassDetails,
};
