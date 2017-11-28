const storage = require('../../infrastructure/deviceStorage/index');
const { hotp } = require('speakeasy');

const action = async (req, res) => {
  const serialNumber = req.params.serial_number;
  const code = req.body.code;
  if (!code) {
    return res.status(400).contentType('json').send('{"message":"code must be supplied"}');
  }

  const deviceDetails = await storage.getDigipassDetails(serialNumber);
  const isValid = hotp.verify({
    secret: deviceDetails.secret,
    encoding: 'base32',
    counter: deviceDetails.counterPosition,
    token: code.toString(),
    window: 10,
  });

  return res.contentType('json').send(JSON.stringify({
    valid: isValid,
  }));
};

module.exports = action;
