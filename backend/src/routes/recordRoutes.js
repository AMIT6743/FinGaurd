const express = require('express');
const router = express.Router();
const recordController = require('../controllers/recordController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const recordValidation = require('../validations/recordValidation');

// Analyst and admin can read records (viewer is dashboard-only)
router.get('/', auth, rbac(['analyst', 'admin']), validate(recordValidation.getRecords), recordController.getRecords);

// Only analyst and admin can create records
router.post('/', auth, rbac(['analyst', 'admin']), validate(recordValidation.createRecord), recordController.createRecord);

// Only admin can update records
router.put('/:id', auth, rbac(['admin']), validate(recordValidation.updateRecord), recordController.updateRecord);

// Only admin can delete records
router.delete('/:id', auth, rbac(['admin']), validate(recordValidation.deleteRecord), recordController.deleteRecord);

module.exports = router;

