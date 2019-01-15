'use strict';

jest.mock('./../../../src/infrastructure/data', () => ({
  listDevices: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const httpMocks = require('node-mocks-http');

const { listDevices } = require('./../../../src/infrastructure/data');
const verifyDigipass = require('./../../../src/app/digipass/getAllDeviceSerialNumbers');

describe('When getting all device serial nubmers', () => {
  let req;
  let res;
  const expectedRequestCorrelationId = 'a890337d-679a-4ee1-82b1-187770c256a7';

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

    listDevices.mockReset().mockReturnValue({
      devices: [{
        id: 'device-one',
        type: 'test',
        serialNumber: '12345',
        deactivated: false,
        deactivatedReason: undefined,
      }, {
        id: 'device-two',
        type: 'test',
        serialNumber: '54321',
        deactivated: false,
        deactivatedReason: undefined,
      }],
      numberOfPages: 1,
    });
    res = httpMocks.createResponse();
  });
  afterEach(() => {
    expect(res._isEndCalled()).toBe(true);
  });
  it('then it should return an array of serial numbers', async () => {
    await verifyDigipass(req, res);

    expect(res).not.toBeNull();
    expect(res.statusCode).toBe(200);
    expect(JSON.parse(res._getData())).toHaveLength(2);
    expect(listDevices.mock.calls[0][0]).toBe('digipass');
  });
  it('then if there are no records an empty array is returned', async () => {
    listDevices.mockReturnValue({ devices: [], numberOfPages: 0 });

    await verifyDigipass(req, res);

    expect(res).not.toBeNull();
    expect(JSON.parse(res._getData()).length).toBe(0);
  });
});
