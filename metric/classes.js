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

// Our frozen array of Metric instances
class MetricList extends Array {
  constructor(array) {
    super()

    if (! Array.isArray(array)) throw new TypeError('An array is required')
    array.forEach((metric, index) => {
      if (metric instanceof Metric) this.push(metric)
      else throw new TypeError(`Needed a metric at index ${index}`)
    })
    Object.freeze(this)
  }
}

module.exports = { Metric, MetricList }
