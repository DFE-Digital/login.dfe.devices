'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('../../infrastructure/config/index');
const { asyncWrapper } = require('login.dfe.express-error-handling');
const { deprecate } = require('./../../utils');

const router = express.Router({ mergeParams: true });

const pkcsParser = require('./pkcsParser');

const addDigipassDevices = require('./addDigipassDevices');
const verifyDigipass = require('./verifyDigipass');
const syncDigipass = require('./syncDigipass');
const getAllDeviceSerialNumbers = require('./getAllDeviceSerialNumbers');
const checkDeviceExists = require('./checkDeviceExists');
const deactivateDigipass = require('./deactivateDigipass');

const list = require('./list');

const routes = () => {

  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  router.get('/v2', asyncWrapper(list));

  router.get('/', deprecate('/digipass/v2'), asyncWrapper(getAllDeviceSerialNumbers));
  router.post('/', pkcsParser, asyncWrapper(addDigipassDevices));

  router.get('/:serial_number', asyncWrapper(checkDeviceExists));
  router.post('/:serial_number/verify', asyncWrapper(verifyDigipass));
  router.post('/:serial_number/sync', asyncWrapper(syncDigipass));
  router.put('/:serial_number/deactivate', asyncWrapper(deactivateDigipass));

  return router;
};

module.exports = routes;