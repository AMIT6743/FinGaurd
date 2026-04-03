const Joi = require('joi');

const createRecord = {
  body: Joi.object().keys({
    amount: Joi.number().positive().required(),
    type: Joi.string().valid('income', 'expense').required(),
    category: Joi.string().required(),
    date: Joi.string().isoDate().optional(),
    note: Joi.string().allow('').optional(),
  }),
};

const getRecords = {
  query: Joi.object().keys({
    type: Joi.string().valid('income', 'expense').optional(),
    category: Joi.string().optional(),
    date: Joi.string().optional(),
    search: Joi.string().optional(),
    page: Joi.number().integer().min(1).default(1).optional(),
    limit: Joi.number().integer().min(1).max(100).default(10).optional(),
  }),
};

const updateRecord = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
  body: Joi.object().keys({
    amount: Joi.number().positive().optional(),
    type: Joi.string().valid('income', 'expense').optional(),
    category: Joi.string().optional(),
    date: Joi.string().isoDate().optional(),
    note: Joi.string().allow('').optional(),
  }).min(1),
};

const deleteRecord = {
  params: Joi.object().keys({
    id: Joi.string().required(),
  }),
};

module.exports = {
  createRecord,
  getRecords,
  updateRecord,
  deleteRecord,
};
