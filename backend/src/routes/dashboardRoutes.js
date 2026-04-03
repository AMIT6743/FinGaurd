const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');

// All authenticated users can view dashboard summary
router.get('/summary', auth, rbac(['viewer', 'analyst', 'admin']), dashboardController.getSummary);

module.exports = router;
