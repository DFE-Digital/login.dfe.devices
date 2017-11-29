const getDigipassDetails = (serialNumber) => {
  return {
    serialNumber,
    counterPosition: 0,
    secret: 'some-secret',
    codeLength: 8,
  };
};
const storeDigipassDetails = async ({ serialNumber, secret, counterPosition, codeLength }) => {
  return Promise.resolve(null);
};

module.exports = {
  getDigipassDetails,
  storeDigipassDetails,
};
