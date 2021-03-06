const fs = require('fs');
const path = require('path');
var pg = require('pg');
pg.defaults.parseInt8 = true;
const Sequelize = require('sequelize');
const logger = require('../logger');

const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASSWORD, {
  host: process.env.DB_HOST,
  dialect: 'postgres',
  benchmark: true,
  logging: (msg, executionTime) => {
    logger.info(`[${executionTime} ms] ${msg}`);
  },
  pool: {
    max: 50,
    min: 3,
    acquire: 30000,
    idle: 10000
  }
});
const db = {};
const excludedFromModels = ['index.js', 'register.js', 'hooks'];
fs.readdirSync(__dirname)
  .filter(file => {
    return file.indexOf('.') !== 0 && !excludedFromModels.includes(file);
  })
  .forEach(file => {
    const model = require(path.join(__dirname, file));
    db.names = [...(db.names || []), model.name];
    db[model.name] = model;
  });

Object.keys(db).forEach(modelName => {
  if ('associate' in db[modelName]) {
    db[modelName].associate(db);
  }
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

module.exports = db;
