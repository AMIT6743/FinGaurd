const express = require('express');
const router = express.Router();

const userController = require('../controllers/userController');
const auth = require('../middleware/auth');
const rbac = require('../middleware/rbac');
const validate = require('../middleware/validate');
const userValidation = require('../validations/userValidation');

// Public route
router.post('/login', validate(userValidation.login), userController.login);

// Apply auth to all routes below
router.use(auth);

// Admin routes
router.post(
  '/',
  rbac(['admin']),
  validate(userValidation.createUser),
  userController.createUser
);

router.get(
  '/',
  rbac(['admin']),
  userController.getUsers
);

router.get(
  '/:id',
  rbac(['admin']),
  userController.getUserById
);

router.patch(
  '/:id',
  rbac(['admin']),
  validate(userValidation.updateUser),
  userController.updateUser
);

router.patch(
  '/:id/status',
  rbac(['admin']),
  validate(userValidation.updateUserStatus),
  userController.updateUserStatus
);

module.exports = router;