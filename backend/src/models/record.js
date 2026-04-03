const { DataTypes } = require('sequelize');
const sequelize = require('../store/database');

const Record = sequelize.define('Record', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  amount: {
    type: DataTypes.FLOAT,
    allowNull: false,
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  category: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  date: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  note: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  isDeleted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'records',
  timestamps: true,
  indexes: [
    // Speed up per-user record listing (most common query)
    { fields: ['userId', 'isDeleted'] },
    // Speed up type and category filters
    { fields: ['type'] },
    { fields: ['category'] },
    // Speed up date-range filters and monthly GROUP BY
    { fields: ['date'] },
    // Speed up dashboard aggregate queries
    { fields: ['isDeleted'] },
  ],
});

module.exports = Record;
