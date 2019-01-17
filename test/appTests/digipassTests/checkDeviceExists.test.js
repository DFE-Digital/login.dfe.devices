jest.mock('./../../../src/infrastructure/data', () => {
  return {
    getDeviceByTypeAndSerialNumber: jest.fn(),
  };
});
jest.mock('./../../../src/infrastructure/deviceStorage', () => {
  return {
    getDigipassDetails: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
const { getDeviceByTypeAndSerialNumber } = require('./../../../src/infrastructure/data');
const { getDigipassDetails } = require('./../../../src/infrastructure/deviceStorage');
const checkDeviceExists = require('./../../../src/app/digipass/checkDeviceExists');

describe('when checking if a digipass exists with a serial number', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      header: () => 'correlation-id',
      params: {
        serial_number: '112345671',
      },
      query: {},
    };

    res = httpMocks.createResponse();

    getDeviceByTypeAndSerialNumber.mockReset().mockReturnValue({
      id: 'device1',
      type: 'digipass',
      serialNumber: '1212345671',
      deactivated: false,
      deactivatedReason: undefined,
    });

    getDigipassDetails.mockReset().mockReturnValue({
      serialNumber: '1212345671',
      counterPosition: 0,
      secret: 'some-secret',
      codeLength: 8,
      unlock1: '123456',
    });
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then it should get device details using serial number from params', async () => {
    await checkDeviceExists(req, res);

    expect(getDeviceByTypeAndSerialNumber).toHaveBeenCalledTimes(1);
    expect(getDeviceByTypeAndSerialNumber).toHaveBeenCalledWith('digipass', '112345671');
  });

  it('then it should return 204 if device found', async () => {
    await checkDeviceExists(req, res);

    expect(res.statusCode).toBe(204);
  });

  it('then it should return 404 if device not found', async () => {
    getDeviceByTypeAndSerialNumber.mockReturnValue(undefined);

    await checkDeviceExists(req, res);

    expect(res.statusCode).toBe(404);
  });

  it('then the fields will be filtered if the query string is populated and the values returned in the response', async () => {
    req.query.fields = 'unlock1';

    await checkDeviceExists(req, res);

    expect(getDigipassDetails).toHaveBeenCalledTimes(1);
    expect(getDigipassDetails).toHaveBeenCalledWith('112345671', 'correlation-id');
    expect(res._getData().unlock1).toBe('123456');
    expect(res._getData().serialNumber).toBe(undefined);
  });
});
