const SimpleSchema = require('simpl-schema').default;
const { validateConfigAgainstSchema, schemas, patterns } = require('login.dfe.config.schema.common');
const config = require('./index');
const logger = require('./../logger');

const secureStorageSchema = new SimpleSchema({
  type: {
    type: String,
    allowedValues: ['static', 'keyvault'],
  },
  params: {
    type: Object,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'keyvault' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },

  'params.uri': {
    type: String,
    regEx: patterns.url,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'keyvault' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
  'params.clientId': {
    type: String,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'keyvault' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
  'params.clientSecret': {
    type: String,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'keyvault' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
  'params.tenant': {
    type: String,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'keyvault' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
  'params.authority': {
    type: String,
    regEx: patterns.url,
    optional: true,
    custom: function () {
      if (this.field('type').value === 'keyvault' && !this.isSet) {
        return SimpleSchema.ErrorTypes.REQUIRED;
      }
    },
  },
});

const digipassSchema = new SimpleSchema({
  pkcsKey: String,
  syncWindow: SimpleSchema.Integer,
});

const schema = new SimpleSchema({
  loggerSettings: schemas.loggerSettings,
  hostingEnvironment: schemas.hostingEnvironment,
  auth: schemas.apiServerAuth,
  storage: schemas.sequelizeConnection,
  secureStorage: secureStorageSchema,
  digipass: digipassSchema,
  assets: schemas.assets,
});

module.exports.validate = () => {
  validateConfigAgainstSchema(config, schema, logger)
};