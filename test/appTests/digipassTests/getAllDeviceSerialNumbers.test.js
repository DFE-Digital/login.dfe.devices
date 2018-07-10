'use strict';

jest.mock('./../../../src/infrastructure/cache', () => ({
  list: jest.fn(),
}));
jest.mock('./../../../src/infrastructure/logger', () => ({
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn(),
}));

const httpMocks = require('node-mocks-http');

const { list } = require('./../../../src/infrastructure/cache');
const verifyDigipass = require('./../../../src/app/digipass/getAllDeviceSerialNumbers');

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

    list.mockReset().mockReturnValue({
      data: [
        {
          serialNumber: 12345,
        },
        {
          serialNumber: 54321,
        },
      ],
      lastUpdated: Date.now(),
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
    expect(res._getData()).toHaveLength(2);
    expect(list.mock.calls[0][0]).toBe('digipass');
  });
  it('then if there are no records an empty array is returned', async () => {
    list.mockReturnValue([]);

    await verifyDigipass(req, res);

    expect(res).not.toBeNull();
    expect(res._getData().length).toBe(0);
  });
  it('then it should return 503 with 30s backoff if cache has not finished building', async () => {
    list.mockReturnValue({
      data: [],
      lastUpdated: undefined,
    });

    await verifyDigipass(req, res);

    expect(res.statusCode).toBe(503);
    expect(res._getHeaders()).toMatchObject({
      'Retry-After': '30',
    });
  });
});
