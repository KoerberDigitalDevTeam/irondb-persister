'use strict'

const expect = require('chai').expect
const metric = require('../metric')

describe('Metric Object', () => {
  it('should have the required methods', () => {
    expect(metric).to.be.an('object')
    expect(metric.validate).to.be.a('function')
  })
})

