'use strict';

const express = require('express');
const apiAuth = require('login.dfe.api.auth');
const config = require('../../infrastructure/config/index');

const router = express.Router({ mergeParams: true });

const verifyDigipass = require('./verifyDigipass');

const routes = () => {
  router.use(apiAuth(router, config));

  router.post('/:serial_number/verify', verifyDigipass);

  return router;
};

module.exports = routes;