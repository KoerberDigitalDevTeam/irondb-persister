'use strict'

const { parse, serialize } = require('../metric')
const { Metric } = require('../metric/classes.js')
const expect = require('chai').expect

const uuid = 'd562b0f9-9068-4d01-880f-7df32b4bf9ad'
const timestamp = Date.now()

const metric = {
  timestamp,
  uuid,
  name: 'metricName',
  value: 'a value',
}

describe('Buffer Serialization', () => {
  it('should serialize and re-parse a metric', () => {
    let buffer = serialize(metric)

    expect(buffer).to.be.instanceof(Buffer)

    let result = parse(buffer)

    expect(result).to.be.instanceof(Metric)
    expect(result).to.eql({
      timestamp,
      uuid,
      name: 'metricName',
      value: 'a value',
      type: 'string',
      accountId: 0,
    })

    // console.log(result)
  })
})

