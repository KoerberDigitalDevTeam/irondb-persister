'use strict'

// Our internal Metric class
class Metric {
  constructor(object) {
    for (let property in object) {
      Object.defineProperty(this, property, {
        enumerable: true,
        configurable: false,
        value: object[property],
      })
    }
    Object.freeze(this)
  }
}

module.exports = Metric
