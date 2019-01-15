jest.mock('./../../../src/infrastructure/data', () => ({
  listDevices: jest.fn(),
}));

const { listDevices } = require('./../../../src/infrastructure/data');
const list = require('./../../../src/app/digipass/list');

describe('when listing devices', () => {
  let req;
  let res;

  beforeEach(() => {
    listDevices.mockReset().mockReturnValue({
      devices: [{
        id: 'device-one',
        type: 'test',
        serialNumber: '1234567890',
        deactivated: false,
        deactivatedReason: undefined,
      }],
      numberOfPages: 2,
    });

    req = {
      query: {},
    };

    res = {
      status: jest.fn(),
      send: jest.fn(),
      json: jest.fn(),
    };
    res.status.mockReturnValue(res);
    res.send.mockReturnValue(res);
    res.json.mockReturnValue(res);
  });

  it('then it should send results back as json', async () => {
    await list(req, res);

    expect(res.json).toHaveBeenCalledTimes(1);
    expect(res.json).toHaveBeenCalledWith({
      page: 1,
      numberOfPages: 2,
      devices: [{
        id: 'device-one',
        type: 'test',
        serialNumber: '1234567890',
        deactivated: false,
        deactivatedReason: undefined,
      }],
    });
  });

  it('then it should use defaults to call repository if not query sent', async () => {
    await list(req, res);

    expect(listDevices).toHaveBeenCalledTimes(1);
    expect(listDevices).toHaveBeenCalledWith('digipass', 1, 25);
  });

  it('then it should use query page number if provided', async () => {
    req.query.page = '2';

    await list(req, res);

    expect(listDevices).toHaveBeenCalledTimes(1);
    expect(listDevices).toHaveBeenCalledWith('digipass', 2, 25);
  });

  it('then it should use query pageSize number if provided', async () => {
    req.query.pageSize = '50';

    await list(req, res);

    expect(listDevices).toHaveBeenCalledTimes(1);
    expect(listDevices).toHaveBeenCalledWith('digipass', 1, 50);
  });

  it('then it should send bad request if page not a number', async () => {
    req.query.page = 'somethingelse';

    await list(req, res);

    expect(listDevices).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('page must be a number');
  });

  it('then it should send bad request if page less than 1', async () => {
    req.query.page = '0';

    await list(req, res);

    expect(listDevices).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('page must be at least 1');
  });

  it('then it should send bad request if pageSize not a number', async () => {
    req.query.pageSize = 'somethingelse';

    await list(req, res);

    expect(listDevices).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('pageSize must be a number');
  });

  it('then it should send bad request if pageSize less than 1', async () => {
    req.query.pageSize = '0';

    await list(req, res);

    expect(listDevices).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('pageSize must be at least 1');
  });

  it('then it should send bad request if pageSize more than 500', async () => {
    req.query.pageSize = '501';

    await list(req, res);

    expect(listDevices).toHaveBeenCalledTimes(0);
    expect(res.status).toHaveBeenCalledTimes(1);
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.send).toHaveBeenCalledTimes(1);
    expect(res.send).toHaveBeenCalledWith('pageSize must be no more than 500');
  });
});
