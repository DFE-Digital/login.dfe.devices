'use strict';

jest.mock('./../../../src/infrastructure/data', () => {
  return {
    getDeviceByTypeAndSerialNumber: jest.fn(),
    storeDevice: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');

const { getDeviceByTypeAndSerialNumber, storeDevice } = require('./../../../src/infrastructure/data');
const deactivateDigipass = require('./../../../src/app/digipass/deactivateDigipass');

describe('When deactivating a digipass code', () => {
  let req;
  let res;
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

    getDeviceByTypeAndSerialNumber.mockReset().mockReturnValue({
      id: 'device-one',
      type: 'digipass',
      serialNumber: '12345',
      deactivated: false,
      deactivatedReason: null,
    });
    storeDevice.mockReset();
  });

  it('then it should get digipass details for serial number', async () => {
    await deactivateDigipass(req, res);

    expect(getDeviceByTypeAndSerialNumber).toHaveBeenCalledTimes(1);
    expect(getDeviceByTypeAndSerialNumber).toHaveBeenCalledWith('digipass', '12345');
  });

  it('then it should return not found if serial number not found for device', async () => {
    getDeviceByTypeAndSerialNumber.mockReturnValue(null);

    await deactivateDigipass(req, res);

    expect(res.statusCode).toBe(404);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"No digipass device found with serial number 12345"}');
  });


  it('then it should set the device as disabled', async () => {
    await deactivateDigipass(req, res);

    expect(storeDevice).toHaveBeenCalledTimes(1);
    expect(storeDevice).toHaveBeenCalledWith('digipass', '12345', true, null);
  });

  it('then if a reason has been passed in the body it is stored', async () => {
    req.body = {
      reason: 'Token has been lost',
    };

    await deactivateDigipass(req, res);


    expect(storeDevice).toHaveBeenCalledTimes(1);
    expect(storeDevice).toHaveBeenCalledWith('digipass', '12345', true, 'Token has been lost');
  });
});