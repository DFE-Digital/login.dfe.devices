'use strict';

jest.mock('./../../../src/infrastructure/deviceStorage', () => {
  return {
    getDigipassDetails: jest.fn(),
    storeDigipassDetails: jest.fn(),
  };
});
jest.mock('speakeasy', () => {
  return {
    hotp: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');

const syncDigipass = require('../../../src/app/digipass/syncDigipass');

describe('When verifying a digipass code', () => {
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
        code1: 11111111,
        code2: 22222222,
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
      codeLength: 8,
    });
    digipassStorage.storeDigipassDetails.mockReset();

    hotp = require('speakeasy').hotp;
    hotp.mockReset();
    hotp.mockReturnValue(12345678);
  });

  it('then it should return bad request if code1 missing from body', async () => {
    req.body.code1 = undefined;

    await syncDigipass(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"code1 and code2 must be supplied"}');
  });

  it('then it should return bad request if code2 missing from body', async () => {
    req.body.code1 = undefined;

    await syncDigipass(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"code1 and code2 must be supplied"}');
  });

  it('then it should get digipass details for serial number', async () => {
    await syncDigipass(req, res);

    expect(digipassStorage.getDigipassDetails.mock.calls.length).toBe(1);
    expect(digipassStorage.getDigipassDetails.mock.calls[0][0]).toBe('12345');
    expect(digipassStorage.getDigipassDetails.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });

  it('then it should return not found if serial number not found for device', async () => {
    digipassStorage.getDigipassDetails.mockReset();
    digipassStorage.getDigipassDetails.mockReturnValue(null);

    await syncDigipass(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"No digipass device found with serial number 12345"}');
  });

  it('then it should generate token for every step from current position to sync window if no match found', async () => {
    await syncDigipass(req, res);

    expect(hotp.mock.calls.length).toBe(2000);
    expect(hotp.mock.calls[0][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 123,
      digits: 8,
    });
    expect(hotp.mock.calls[1][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 124,
      digits: 8,
    });
    expect(hotp.mock.calls[999][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 1122,
      digits: 8,
    });
  });

  it('then it should generate token for every step till code1 and code2 are found consecutively', async () => {
    hotp.mockReset();
    hotp.mockImplementation((opts) => {
      if (opts.counter === 130) {
        return '11111111';
      } else if (opts.counter === 131) {
        return '22222222';
      } else {
        return '33333333';
      }
    });

    await syncDigipass(req, res);

    expect(hotp.mock.calls.length).toBe(9);
    expect(hotp.mock.calls[0][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 123,
      digits: 8,
    });
    expect(hotp.mock.calls[8][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 131,
      digits: 8,
    });
  });

  it('then it should generate token for every step from current position to sync window if no consecutive match found', async () => {
    hotp.mockReset();
    hotp.mockImplementation((opts) => {
      if (opts.counter === 130) {
        return '11111111';
      } else if (opts.counter === 135) {
        return '22222222';
      } else {
        return '33333333';
      }
    });

    await syncDigipass(req, res);

    expect(hotp.mock.calls.length).toBe(2000);
    expect(hotp.mock.calls[0][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 123,
      digits: 8,
    });
    expect(hotp.mock.calls[1][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 124,
      digits: 8,
    });
    expect(hotp.mock.calls[999][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 1122,
      digits: 8,
    });
  });

  it('then it should generate token for every step till code1 and code2 are found consecutively (even if a match found earlier)', async () => {
    hotp.mockReset();
    hotp.mockImplementation((opts) => {
      if (opts.counter === 135 || opts.counter === 130) {
        return '11111111';
      } else if (opts.counter === 131) {
        return '22222222';
      } else {
        return '33333333';
      }
    });

    await syncDigipass(req, res);

    expect(hotp.mock.calls.length).toBe(9);
    expect(hotp.mock.calls[0][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 123,
      digits: 8,
    });
    expect(hotp.mock.calls[8][0]).toMatchObject({
      secret: 'base32-test-secret',
      encoding: 'base32',
      counter: 131,
      digits: 8,
    });
  });

  it('then it should return valid response body if code is valid', async () => {
    hotp.mockReset();
    hotp.mockImplementation((opts) => {
      if (opts.counter === 130) {
        return '11111111';
      } else if (opts.counter === 131) {
        return '22222222';
      } else {
        return '33333333';
      }
    });

    await syncDigipass(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(JSON.parse(res._getData()).valid).toBe(true);
  });

  it('then it should return invalid response body if code is not valid', async () => {
    await syncDigipass(req, res);

    expect(res.statusCode).toBe(200);
    expect(res._isJSON()).toBe(true);
    expect(JSON.parse(res._getData()).valid).toBe(false);
  });

  it('then it should set the counter to step after matched pair in storage if successful', async () => {
    hotp.mockReset();
    hotp.mockImplementation((opts) => {
      if (opts.counter === 130) {
        return '11111111';
      } else if (opts.counter === 131) {
        return '22222222';
      } else {
        return '33333333';
      }
    });

    await syncDigipass(req, res);

    expect(digipassStorage.storeDigipassDetails.mock.calls.length).toBe(1);
    expect(digipassStorage.storeDigipassDetails.mock.calls[0][0]).toMatchObject({
      serialNumber: 12345,
      secret: 'base32-test-secret',
      counterPosition: 132,
      codeLength: 8,
    });
    expect(digipassStorage.storeDigipassDetails.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });
});
