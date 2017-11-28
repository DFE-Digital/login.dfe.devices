'use strict';

jest.mock('./../../../src/infrastructure/deviceStorage', () => {
  const getDigipassDetails = jest.fn().mockReturnValue({
    serialNumber: 12345,
    counterPosition: 123,
    secret: 'base32-test-secret',
  });
  return {
    getDigipassDetails,
  };
});
jest.mock('speakeasy', () => {
  return {
    hotp: {
      verify: jest.fn().mockReturnValue(true),
    },
  };
});

const httpMocks = require('node-mocks-http');

const verifyDigipass = require('../../../src/app/digipass/verifyDigipass');

describe('When verifing a digipass code', () => {
  let req;
  let res;

  beforeEach(() => {
    req = {
      params: {
        serial_number: '12345',
      },
      body: {
        code: 9875348,
      },
    };

    res = httpMocks.createResponse();
  });

  it('then it should return bad request if code missing from body', async () => {
    req.body.code = undefined;

    await verifyDigipass(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"code must be supplied"}');
  });

  it('then it should get digipass details for serial number', async () => {
    await verifyDigipass(req, res);

    const digipassStorage = require('./../../../src/infrastructure/deviceStorage');

    expect(digipassStorage.getDigipassDetails.mock.calls.length).toBe(1);
    expect(digipassStorage.getDigipassDetails.mock.calls[0][0]).toBe('12345');
  });

  it('then it should verify code with HOTP using device details', async () => {
    await verifyDigipass(req, res);

    const { hotp } = require('speakeasy');

    expect(hotp.verify.mock.calls.length).toBe(1);
    expect(hotp.verify.mock.calls[0][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 123,
      token: '9875348',
      window: 10,
    });
  });

  it('then it should return valid response body if code is valid', async () => {
    await verifyDigipass(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(JSON.parse(res._getData()).valid).toBe(true);
  });

  it('then it should return invalid response body if code is not valid', async () => {
    const { hotp } = require('speakeasy');
    hotp.verify.mockReset();
    hotp.verify.mockReturnValue(false);

    await verifyDigipass(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(JSON.parse(res._getData()).valid).toBe(false);
  });
});
