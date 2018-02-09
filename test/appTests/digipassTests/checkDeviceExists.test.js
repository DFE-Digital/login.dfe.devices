jest.mock('./../../../src/infrastructure/deviceStorage', () => {
  return {
    getDigipassDetails: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');
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
    };

    res = httpMocks.createResponse();

    getDigipassDetails.mockReset();
    getDigipassDetails.mockReturnValue({
      serialNumber: '1212345671',
      counterPosition: 0,
      secret: 'some-secret',
      codeLength: 8,
    });
  });

  it('then it should get device details using serial number from params', async () => {
    await checkDeviceExists(req, res);

    expect(getDigipassDetails.mock.calls).toHaveLength(1);
    expect(getDigipassDetails.mock.calls[0][0]).toBe('112345671');
    expect(getDigipassDetails.mock.calls[0][1]).toBe('correlation-id');
  });

  it('then it should return 204 if device found', async () => {
    await checkDeviceExists(req, res);

    expect(res.statusCode).toBe(204);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return 404 if device not found', async () => {
    getDigipassDetails.mockReturnValue(null);

    await checkDeviceExists(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isEndCalled()).toBe(true);
  });
});
