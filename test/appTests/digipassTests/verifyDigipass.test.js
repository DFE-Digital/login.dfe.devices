'use strict';

jest.mock('./../../../src/infrastructure/deviceStorage', () => {
  return {
    getDigipassDetails: jest.fn(),
    storeDigipassDetails: jest.fn(),
  };
});
jest.mock('speakeasy', () => {
  return {
    hotp: {
      verifyDelta: jest.fn(),
    },
  };
});

const httpMocks = require('node-mocks-http');

const verifyDigipass = require('../../../src/app/digipass/verifyDigipass');

describe('When verifing a digipass code', () => {
  let req;
  let res;
  let digipassStorage;
  let hotp;
  const expectedRequestCorrelationId = '68bec6ac-bdd1-4b21-8510-065dbb6f3b1b';

  beforeEach(() => {
    req = {
      params: {
        serial_number: '12345',
      },
      body: {
        code: 9875348,
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    digipassStorage = require('./../../../src/infrastructure/deviceStorage');
    digipassStorage.getDigipassDetails.mockReset();
    digipassStorage.getDigipassDetails.mockReturnValue({
      serialNumber: 12345,
      counterPosition: 123,
      secret: 'base32-test-secret',
      codeLength: 10,
    });
    digipassStorage.storeDigipassDetails.mockReset();

    hotp = require('speakeasy').hotp;
    hotp.verifyDelta.mockReset();
    hotp.verifyDelta.mockReturnValue({ delta: 3 });
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
    expect(digipassStorage.getDigipassDetails.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });

  it('then it should verify code with HOTP using device details', async () => {
    await verifyDigipass(req, res);

    const { hotp } = require('speakeasy');

    expect(hotp.verifyDelta.mock.calls.length).toBe(1);
    expect(hotp.verifyDelta.mock.calls[0][0]).toMatchObject({
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
    hotp.verifyDelta.mockReset();
    hotp.verifyDelta.mockReturnValue(undefined);

    await verifyDigipass(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(JSON.parse(res._getData()).valid).toBe(false);
  });

  it('then it should return not found if serial number not found for device', async () => {
    digipassStorage.getDigipassDetails.mockReset();
    digipassStorage.getDigipassDetails.mockReturnValue(null);

    await verifyDigipass(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"No digipass device found with serial number 12345"}');
  });

  it('then it should increment the counter by delta in storage if successful', async () => {
    await verifyDigipass(req, res);

    const digipassStorage = require('./../../../src/infrastructure/deviceStorage');
    expect(digipassStorage.storeDigipassDetails.mock.calls.length).toBe(1);
    expect(digipassStorage.storeDigipassDetails.mock.calls[0][0]).toMatchObject({
      serialNumber: 12345,
      secret: 'base32-test-secret',
      counterPosition: 126,
      codeLength: 10,
    });
    expect(digipassStorage.storeDigipassDetails.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });
});
