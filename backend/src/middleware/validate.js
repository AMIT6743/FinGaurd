const validate = (schema) => (req, res, next) => {
  const dataToValidate = {
    body: req.body,
    query: req.query,
    params: req.params,
  };

  const Joi = require('joi');
  const { value, error } = Joi.object(schema).validate(dataToValidate, {
    abortEarly: false,
    stripUnknown: true,
  });

  if (error) {
    return res.status(400).json({
      errors: error.details.map((err) => ({
        field: err.path.join('.'),
        message: err.message,
      })),
    });
  }

  req.body = value.body;
  req.query = value.query;
  req.params = value.params;

  next();
};

module.exports = validate;