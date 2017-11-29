jest.mock('./../../../src/infrastructure/config', () => {
  return {
    devices: {
      digipass: {
        pkcsKey: '5c1d0a26a318ccfe000c2c2ec422b0cb',
      },
    },
  };
});
jest.mock('body');

const fs = require('fs');
const path = require('path');
const httpMocks = require('node-mocks-http');
const pkcsParser = require('./../../../src/app/digipass/pkcsParser');

const secret = 'ONXW2ZJNONSWG4TFOQ======';
const counter = 0;
const pkcsDoc = fs.readFileSync(path.join(path.resolve(__dirname, 'fixtures', 'pkcs1.xml')), 'utf8');

describe('when processing a request potentially including pkcs content', () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      headers: {
        'content-type': 'application/x-pkcs12',
      },
      body: {},
    };

    res = httpMocks.createResponse();

    next = jest.fn();

    const body = require('body');
    body.mockImplementation((x, done) => {
      done(null, pkcsDoc);
    });
  });

  it('then it should call next when content type is pkcs', async () => {
    await pkcsParser(req, res, next);

    expect(next.mock.calls.length).toBe(1);
  });

  it('then it should call next when content type is not pkcs', async () => {
    req.headers['content-type'] = 'application/json';

    await pkcsParser(req, res, next);

    expect(next.mock.calls.length).toBe(1);
  });

  it('then it should add devices from content to body', async () => {
    await pkcsParser(req, res, next);

    expect(req.body.devices).not.toBeNull();
    expect(req.body.devices.length).toBe(1);
  });

  it('then it should decrypt content into devices', async () => {
    await pkcsParser(req, res, next);

    expect(req.body.devices[0].serialNumber).toBe('918273645');
    expect(req.body.devices[0].secret).toBe(secret);
    expect(req.body.devices[0].counter).toBe(counter);
  });
});
