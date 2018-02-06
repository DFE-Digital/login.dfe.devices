const getDigipassDetails = serialNumber => ({
  serialNumber,
  counterPosition: 0,
  secret: 'some-secret',
  codeLength: 8,
});
const storeDigipassDetails = async ({ serialNumber, secret, counterPosition, codeLength }) => Promise.resolve(null);

const getAllDigipass = async () => [{
  serialNumber: '123-456-789',
}, {
  serialNumber: '234-567-890',
}];

module.exports = {
  getDigipassDetails,
  storeDigipassDetails,
  getAllDigipass,
};
