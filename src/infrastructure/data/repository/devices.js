const { default: Sequelize, Op } = require('sequelize').default;

const define = (db, schema) => {
  return db.define('device', {
    id: {
      type: Sequelize.UUID,
      primaryKey: true,
      allowNull: false,
    },
    type: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    serialNumber: {
      type: Sequelize.STRING,
      allowNull: false,
    },
    deactivated: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
    },
    deactivatedReason: {
      type: Sequelize.STRING,
      allowNull: true,
    },
  }, {
    timestamps: true,
    tableName: 'device',
    schema,
  });
};

const extend = () => {
};

module.exports = {
  name: 'devices',
  define,
  extend,
};