'use strict'

const { init, persist } = require('./lib/client.js')
const { Metric, parse, validate, serialize } = require('./metric')

module.exports = {
  Metric,

  init,
  persist,

  parse,
  validate,
  serialize,
}
