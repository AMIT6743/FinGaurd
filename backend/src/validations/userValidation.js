const Joi = require('joi');

// ✅ Reusable validators
const uuid = Joi.string();

const email = Joi.string().email().lowercase().trim();

const password = Joi.string()
  .min(8)
  .max(32)
  .pattern(/[A-Z]/)        // at least 1 uppercase
  .pattern(/[a-z]/)        // at least 1 lowercase
  .pattern(/[0-9]/)        // at least 1 number
  .pattern(/[^a-zA-Z0-9]/) // at least 1 special char
  .required()
  .messages({
    'string.pattern.base':
      'Password must include uppercase, lowercase, number, and special character',
  });

const role = Joi.string().valid('viewer', 'analyst', 'admin');


// 🔐 LOGIN
const login = {
  body: Joi.object({
    email: email.required(),
    password: Joi.string().required(), // no strict rules here (user already created)
  })
    .required()
    .unknown(false),
};


// 👤 CREATE USER
const createUser = {
  body: Joi.object({
    name: Joi.string().trim().min(2).max(50).required(),
    email: email.required(),
    password: password, // strong password enforced
    role: role.default('viewer'),
  })
    .required()
    .unknown(false),
};


// 🔄 UPDATE USER STATUS
const updateUserStatus = {
  params: Joi.object({
    id: uuid.required(),
  }).required(),

  body: Joi.object({
    isActive: Joi.boolean().required(),
  })
    .required()
    .unknown(false),
};


// 🔄 UPDATE USER (partial)
const updateUser = {
  params: Joi.object({
    id: uuid.required(),
  }).required(),

  body: Joi.object({
    name: Joi.string().trim().min(2).max(50),
    email: email,
    role: role,
  })
    .min(1) // at least one field required
    .required()
    .unknown(false),
};


// 🔑 UPDATE PASSWORD (NEW - IMPORTANT)
const updatePassword = {
  params: Joi.object({
    id: uuid.required(),
  }).required(),

  body: Joi.object({
    password: password,
  })
    .required()
    .unknown(false),
};


module.exports = {
  login,
  createUser,
  updateUserStatus,
  updateUser,
  updatePassword,
};