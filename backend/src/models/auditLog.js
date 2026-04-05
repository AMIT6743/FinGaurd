const { DataTypes } = require('sequelize');
const sequelize = require('../store/database');

const AuditLog = sequelize.define('AuditLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  userId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  recordId: {
    type: DataTypes.UUID,
    allowNull: false,
  },
  action: {
    type: DataTypes.ENUM('UPDATE', 'DELETE'),
    allowNull: false,
  },
  oldValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
  newValues: {
    type: DataTypes.JSON,
    allowNull: true,
  },
}, {
  tableName: 'audit_logs',
  timestamps: true,
});

AuditLog.associate = function(models) {
  AuditLog.belongsTo(models.User, { foreignKey: 'userId', as: 'user' });
};

module.exports = AuditLog;
