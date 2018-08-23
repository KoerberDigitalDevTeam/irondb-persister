'use strict'

const { Metric, parse, serialize } = require('..')
const expect = require('chai').expect

const uuid = 'd562b0f9-9068-4d01-880f-7df32b4bf9ad'
const timestamp = Date.now()

describe('Buffer Serialization', () => {
  it('should serialize and re-parse a minimal metric', () => {
    let buffer = serialize({
      timestamp,
      uuid,
      name: 'metricName',
      value: 'a value',
    })

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
      checkName: '', // it's always non null
      streamTags: [], // always an empty array
    })
  })

  it('should serialize and re-parse a complete metric', () => {
    let buffer = serialize({
      timestamp,
      uuid,
      name: 'metricName',
      value: 999,
      type: 'number',
      checkName: 'theCheckName',
      accountId: 65535,
      streamTags: [ 'a:b', 'c:d' ],
    })

    expect(buffer).to.be.instanceof(Buffer)

    let result = parse(buffer)

    expect(result).to.be.instanceof(Metric)

    expect(result).to.eql({
      timestamp,
      uuid,
      name: 'metricName',
      value: 999,
      type: 'number',
      accountId: 65535,
      checkName: 'theCheckName',
      streamTags: [ 'a:b', 'c:d' ],
    })
  })

  it('should serialize and re-parse an array of metrics', () => {
    let buffer = serialize([ {
      timestamp,
      uuid,
      name: 'metricName',
      value: 'a value',
    }, {
      timestamp,
      uuid,
      name: 'metricName',
      value: 999,
      type: 'number',
      checkName: 'theCheckName',
      accountId: 65535,
      streamTags: [ 'a:b', 'c:d' ],
    } ])

    expect(buffer).to.be.instanceof(Buffer)

    let result = parse(buffer)

    expect(result).to.be.an('array')

    expect(result).to.eql([ {
      timestamp,
      uuid,
      name: 'metricName',
      value: 'a value',
      type: 'string',
      accountId: 0,
      checkName: '', // it's always non null
      streamTags: [], // always an empty array
    }, {
      timestamp,
      uuid,
      name: 'metricName',
      value: 999,
      type: 'number',
      accountId: 65535,
      checkName: 'theCheckName',
      streamTags: [ 'a:b', 'c:d' ],
    } ])
  })
})

