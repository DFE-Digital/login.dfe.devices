'use strict';

jest.mock('./../../../src/infrastructure/deviceStorage', () => ({
  getAllDigipass: jest.fn(),
}));

const httpMocks = require('node-mocks-http');

const verifyDigipass = require('../../../src/app/digipass/getAllDeviceSerialNumbers');

describe('When getting all device serial nubmers', () => {
  let req;
  let res;
  const expectedRequestCorrelationId = 'a890337d-679a-4ee1-82b1-187770c256a7';
  let digipassStorage;

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

    digipassStorage = require('./../../../src/infrastructure/deviceStorage');
    digipassStorage.getAllDigipass.mockReset();
    digipassStorage.getAllDigipass.mockReturnValue([
      {
        serialNumber: 12345,
      },
      {
        serialNumber: 54321,
      },
    ]);
    res = httpMocks.createResponse();
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then it should return an array of serial numbers', async () => {
    await verifyDigipass(req,res);

    expect(res).not.toBeNull();
    expect(res._getData().length).toBe(2);
    expect(digipassStorage.getAllDigipass.mock.calls[0][0]).toBe(expectedRequestCorrelationId);
  });
  it('then if there are no records an empty array is returned', async () => {
    digipassStorage.getAllDigipass.mockReset();
    digipassStorage.getAllDigipass.mockReturnValue([]);

    await verifyDigipass(req,res);

    expect(res).not.toBeNull();
    expect(res._getData().length).toBe(0);
  });
});
