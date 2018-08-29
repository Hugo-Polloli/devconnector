const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateCommentInput(data) {
  let errors = {};

  const dataFields = ['text'];

  if (!Validator.isLength(data.text, { min: 10, max: 300 })) {
    errors.text = 'Comment must be between 10 and 300 characters';
  }

  dataFields.forEach(field => {
    data[field] = !isEmpty(data[field]) ? data[field] : '';
    if (Validator.isEmpty(data[field])) {
      errors[field] = `${field} is required`;
    }
  });

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
