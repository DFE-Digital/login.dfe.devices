const getDigipassDetails = (serialNumber) => {
  return {
    serialNumber,
    counterPosition: 0,
    secret: 'some-secret',
    codeLength: 8,
  };
};

module.exports = {
  getDigipassDetails,
};
