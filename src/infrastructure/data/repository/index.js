'use strict';

const config = require('./../../config');

const { makeConnection } = require('./connection');
const devices = require('./devices');

const db = makeConnection();

const defineStatic = (model) => {
};
const buildDataModel = (model, connection, entityModels) => {
  const dbSchema = config.storage.schema || 'dbo';

  // Define
  entityModels.forEach((entityModel) => {
    model[entityModel.name] = entityModel.define(db, dbSchema);
  });
  defineStatic(model);

  // Extend
  entityModels.filter(m => m.extend !== undefined).forEach((entityModel) => {
    entityModel.extend(model);
  });
};
const dataModel = {};
buildDataModel(dataModel, db, [
  devices,
]);
dataModel.connection = db;


module.exports = dataModel;