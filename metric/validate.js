'use strict'

const Metric = require('./metric.js')
const schema = require('./schema.js')
const Validator = require('../lib/validator.js')
const validator = new Validator()

// Cache our schema within the validator itself
const $ref = schema.id || '/Metric'
validator.addSchema(schema, $ref)

// Internal method to normalise and validate a metric
function validateMetric(metric) {
  if (metric == null) throw new TypeError('Metric must not be null')
  if (metric instanceof Metric) return metric

  let clone = validator.validate(metric, { $ref }, { propertyName: 'metric' })

  // Normalise timestamp, either parse the string or convert seconds to milliseconds
  if (typeof clone.timestamp === 'string') clone.timestamp = Date.parse(clone.timestamp)
  else if (clone.timestamp < 10000000000) clone.timestamp = clone.timestamp * 1000
  clone.timestamp = Math.round(clone.timestamp)

  // Normalise check UUID to its lower-case value
  clone.uuid = clone.uuid.toLowerCase()

  // Normalise boolean values to "true" or "false" as strings
  if (typeof clone.value === 'boolean') clone.value = clone.value.toString()

  // Validate the value / type pair
  if (clone.type == null) {
    if (clone.value == null) {
      throw new TypeError('Metric value and type can not both be null')
    }
    clone.type = typeof clone.value
  } else if (clone.value != null) {
    if (typeof clone.value !== clone.type) {
      throw new TypeError(`Metric specifies type as ${clone.type} but typeof value is ${typeof clone.value}`)
    }
  }

  return new Metric(clone)
}

// Validate and normalise a metric or array of metrics
function validate(metric) {
  if (metric instanceof Metric) return metric

  if (Array.isArray(metric)) {
    let converted = 0
    let array = metric.reduce((array, current, index) => {
      if (current instanceof Metric) {
        array.push(current)
      } else {
        array.push(validateMetric(current))
        converted ++
      }
      return array
    }, [])
    return converted == 0 ? metric : array
  }

  if (typeof metric === 'object') return validateMetric(metric)

  throw new TypeError('Metric must be an object or an array')
}

module.exports = validate
