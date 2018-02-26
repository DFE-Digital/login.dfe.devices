'use strict';

jest.mock('./../../../src/infrastructure/deviceStorage', () => {
  return {
    getDigipassDetails: jest.fn(),
    storeDigipassDetails: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');

const deactivateDigipass = require('../../../src/app/digipass/deactivateDigipass');

describe('When deactivating a digipass code', () => {
  let req;
  let res;
  let digipassStorage;
  const expectedRequestCorrelationId = '68bec6ac-bdd1-4b21-8510-065dbb6f3b1b';

  beforeEach(() => {
    req = {
      params: {
        serial_number: '12345',
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

  });

  it('then it should get digipass details for serial number', async () => {
    await deactivateDigipass(req, res);

    expect(digipassStorage.getDigipassDetails.mock.calls.length).toBe(1);
    expect(digipassStorage.getDigipassDetails.mock.calls[0][0]).toBe('12345');
    expect(digipassStorage.getDigipassDetails.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });

  it('then it should return not found if serial number not found for device', async () => {
    digipassStorage.getDigipassDetails.mockReset();
    digipassStorage.getDigipassDetails.mockReturnValue(null);

    await deactivateDigipass(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"No digipass device found with serial number 12345"}');
  });


  it('then it should set the device as disabled', async () => {
    await deactivateDigipass(req, res);

    expect(digipassStorage.storeDigipassDetails.mock.calls.length).toBe(1);
    expect(digipassStorage.storeDigipassDetails.mock.calls[0][0]).toMatchObject({
      serialNumber: 12345,
      secret: 'base32-test-secret',
      counterPosition: 123,
      codeLength: 8,
      deactivated: true,
    });
    expect(digipassStorage.storeDigipassDetails.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });

  it('then if a reason has been passed in the body it is stored', async () => {
    req.body = {
      reason: 'Token has been lost',
    };

    await deactivateDigipass(req, res);

    expect(digipassStorage.storeDigipassDetails.mock.calls.length).toBe(1);
    expect(digipassStorage.storeDigipassDetails.mock.calls[0][0]).toMatchObject({
      serialNumber: 12345,
      secret: 'base32-test-secret',
      counterPosition: 123,
      codeLength: 8,
      deactivated: true,
      deactivatedReason: 'Token has been lost',
    });
    expect(digipassStorage.storeDigipassDetails.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
  });
});