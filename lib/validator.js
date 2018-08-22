'use strict'

const Validator = require('jsonschema').Validator
const validate = Validator.prototype.validate

function injectDefaults(instance, property, schema, options, context) {
  if (instance.hasOwnProperty(property)) return
  if (schema.hasOwnProperty('default')) instance[property] = schema.default
}

Validator.prototype.validate = function validateWithDefaults(instance, schema, options = {}) {
  options.preValidateProperty = injectDefaults.bind(this)

  let clone = Object.assign({}, instance)
  let result = validate.call(this, clone, schema, options)
  if (result.valid) return clone

  let propertyName = options.propertyName || 'instance'
  let message = 'Found ' + result.errors.length + ' errors validating ' + propertyName
  let stack = message
  let details = []

  for (let error of result.errors) {
    stack = stack + '\n- ' + error.stack
    details.push(error.stack)
  }

  let error = new TypeError(message)
  error.details = details
  error.stack = stack
  throw error
}

module.exports = Validator
