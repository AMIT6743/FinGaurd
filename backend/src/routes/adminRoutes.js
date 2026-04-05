const express = require('express');
const router = express.Router();
const AuditLog = require('../models/auditLog');
const User = require('../models/user');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// GET /api/admin/audit-logs
router.get('/audit-logs', auth, rbac(['analyst', 'admin']), async (req, res, next) => {
  try {
    const logs = await AuditLog.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: User,
          as: 'user',
          attributes: ['email']
        }
      ]
    });

    const formattedLogs = logs.map(log => ({
      id: log.id,
      userEmail: log.user ? log.user.email : 'Unknown',
      action: log.action,
      oldValues: log.oldValues,
      newValues: log.newValues,
      createdAt: log.createdAt,
    }));

    res.json(formattedLogs);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
