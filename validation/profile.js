const Validator = require('validator');
const isEmpty = require('./is-empty');

module.exports = function validateProfileInput(data) {
  let errors = {};

  let URLs = Object.keys(Profile.schema.tree.social);
  URLs = ['website', ...URLs];

  const dataFields = ['handle', 'status', 'skills'];

  dataFields.forEach(field => {
    data[field] = !isEmpty(data[field]) ? data[field] : '';
    if (Validator.isEmpty(data[field])) {
      errors[field] = `${field} is required`;
    }
  });

  if (
    !isEmpty(data.handle) &&
    !Validator.isLength(data.handle, { min: 2, max: 40 })
  ) {
    errors.handle = 'Handle must be between 2 and 40 characters';
  }

  if (Validator.isEmpty(data.handle)) {
    errors.handle = 'Handle is required';
  }

  for (const URL of URLs) {
    if (!isEmpty(data[URL]) && !Validator.isURL(data[URL])) {
      errors[URL] = `Badly formatted URL for ${URL}`;
    }
  }

  return {
    errors,
    isValid: isEmpty(errors)
  };
};
