jest.mock('./../../../src/infrastructure/deviceStorage', () => {
  return {
    storeDigipassDetails: jest.fn(),
  };
});

const httpMocks = require('node-mocks-http');

const addDigipassDevices = require('../../../src/app/digipass/addDigipassDevices');

describe('when adding digipass devices to system', () => {
  let req;
  let res;
  let storage;
  const expectedRequestCorrelationId = '68bec6ac-bdd1-4b21-8510-065dbb6f3b1b';

  beforeEach(() => {
    req = {
      body: {
        devices: [
          {
            serialNumber: 1001,
            secret: 'token1Secret',
            counter: 101,
            unlock1: 'oneunlock1',
            unlock2: 'oneunlock2',
          },
          {
            serialNumber: 2002,
            secret: 'token2Secret',
            counter: 202,
            unlock1: 'twounlock1',
            unlock2: 'twounlock2',
          },
        ],
      },
      headers: {
        'x-correlation-id': expectedRequestCorrelationId,
      },
      header(header) {
        return this.headers[header];
      },
    };

    res = httpMocks.createResponse();

    storage = require('./../../../src/infrastructure/deviceStorage');
  });

  it('then it should store the all devices in storage', async () => {
    await addDigipassDevices(req, res);

    expect(storage.storeDigipassDetails.mock.calls.length).toBe(2);
    expect(storage.storeDigipassDetails.mock.calls[0][0]).toMatchObject({
      serialNumber: 1001,
      secret: 'token1Secret',
      counterPosition: 101,
      codeLength: 8,
      unlock1: 'oneunlock1',
      unlock2: 'oneunlock2',
    });
    expect(storage.storeDigipassDetails.mock.calls[1][0]).toMatchObject({
      serialNumber: 2002,
      secret: 'token2Secret',
      counterPosition: 202,
      codeLength: 8,
      unlock1: 'twounlock1',
      unlock2: 'twounlock2',
    });
    expect(storage.storeDigipassDetails.mock.calls[0][1]).toBe(expectedRequestCorrelationId);
    expect(storage.storeDigipassDetails.mock.calls[1][1]).toBe(expectedRequestCorrelationId);
  });

  it('then it should return an accepted result', async () => {
    await addDigipassDevices(req, res);

    expect(res.statusCode).toBe(202);
    expect(res._isEndCalled()).toBe(true);
  });

  it('then it should return bad request devices missing from body', async () => {
    req.body.devices = undefined;

    await addDigipassDevices(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"devices must be supplied"}');
  });

  it('then it should return bad request devices is an empty array', async () => {
    req.body.devices = [];

    await addDigipassDevices(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"devices must be supplied"}');
  });

  it('then it should return bad request devices is not an array', async () => {
    req.body.devices = {};

    await addDigipassDevices(req, res);

    expect(res.statusCode).toBe(400);
    expect(res._isJSON()).toBe(true);
    expect(res._getData()).toBe('{"message":"devices must be an Array"}');
  });
});
