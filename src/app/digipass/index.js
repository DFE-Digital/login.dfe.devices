'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('../../infrastructure/config/index');

const router = express.Router({ mergeParams: true });

const pkcsParser = require('./pkcsParser');

const addDigipassDevices = require('./addDigipassDevices');
const verifyDigipass = require('./verifyDigipass');
const syncDigipass = require('./syncDigipass');
const getAllDeviceSerialNumbers = require('./getAllDeviceSerialNumbers');
const checkDeviceExists = require('./checkDeviceExists');

const routes = () => {

  if (config.hostingEnvironment.env !== 'dev') {
    router.use(apiAuth(router, config));
  }

  router.get('/', getAllDeviceSerialNumbers);
  router.post('/', pkcsParser, addDigipassDevices);

  router.get('/:serial_number', checkDeviceExists);
  router.post('/:serial_number/verify', verifyDigipass);
  router.post('/:serial_number/sync', syncDigipass);

  return router;
};

module.exports = routes;