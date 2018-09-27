const expect = require('chai').expect
const { Metric, validate } = require('..')

const uuid = 'd562b0f9-9068-4d01-880f-7df32b4bf9ad'
const timestamp = Date.now()

const metric = {
  timestamp,
  uuid,
  name: 'metricName',
  value: 'a value',
}

const valid = {
  timestamp,
  uuid,
  name: 'metricName',
  value: 'a value',
  type: 'string',
  account: 0,
}

// Clone object and delete properties, e.g.: c({myfoo:1}).d('myfoo')
function c(...objects) {
  let clone = Object.assign({}, ...objects)

  return Object.defineProperty(clone, 'd', {
    enumerable: false,
    configurable: false,
    value: function d(prop) {
      delete clone[prop]
      return clone
    },
  })
}

/* ========================================================================== */

describe('Metric Validation Tests', () => {
  it('should validate a basic metric', () => {
    let result = validate(metric)
    expect(result).to.be.instanceof(Metric)
    expect(result).to.eql(valid)
  })

  it('should validate an array of metrics', () => {
    let result = validate([
      metric,
      c(metric, { account: 123 }),
      c(metric, { timestamp: 0 }),
      c(metric, { value: 123 }),
      c(metric, { tags: [ 'foo:bar' ] }),
    ])

    expect(result).to.be.an('array')

    expect(result).to.eql([
      valid,
      c(valid, { account: 123 }),
      c(valid, { timestamp: 0 }),
      c(valid, { value: 123, type: 'number' }),
      c(valid, { tags: [ 'foo:bar' ] }),
    ])
  })

  it('should not revalidate metrics', () => {
    let m1 = validate(metric)
    let m2 = validate(metric)
    let m3 = validate(m1)

    expect(m1).not.to.equal(m2)
    expect(m2).not.to.equal(m3)
    expect(m1).to.eql(m2)
    expect(m1).to.equal(m3)
  })

  /* ------------------------------------------------------------------------ */

  describe('Timestamps', () => {
    it('should not validate without a valid timestamp', () => {
      expect(() => validate(c(metric).d('timestamp')))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric requires property "timestamp"' ])

      expect(() => validate(c(metric, { timestamp: null })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.timestamp is not of a type(s) number,string' ])

      expect(() => validate(c(metric, { timestamp: true })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.timestamp is not of a type(s) number,string' ])

      expect(() => validate(c(metric, { timestamp: '1970-01-01T00:00:00' })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.timestamp does not conform to the "date-time" format' ])
    })

    it('should validate with a string timestamp', () => {
      expect(validate(c(metric, { timestamp: '1970-01-01T00:00:01Z' })))
        .to.eql(c(valid, { timestamp: 1000 }))
      expect(validate(c(metric, { timestamp: '1970-01-01T00:00:01.001Z' })))
        .to.eql(c(valid, { timestamp: 1001 }))
    })

    it('should validate with a numeric timestamp', () => {
      expect(validate(c(metric, { timestamp: 0 })))
        .to.eql(c(valid, { timestamp: 0 }))
      expect(validate(c(metric, { timestamp: 1 })))
        .to.eql(c(valid, { timestamp: 1000 }))
      expect(validate(c(metric, { timestamp: 9999999999 })))
        .to.eql(c(valid, { timestamp: 9999999999000 }))
      expect(validate(c(metric, { timestamp: 10000000000 })))
        .to.eql(c(valid, { timestamp: 10000000000 }))
    })
  })

  /* ------------------------------------------------------------------------ */

  describe('Check UUIDs', () => {
    it('should not validate without a valid check uuid', () => {
      expect(() => validate(c(metric).d('uuid')))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric requires property "uuid"' ])

      expect(() => validate(c(metric, { uuid: null })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.uuid is not of a type(s) string' ])

      expect(() => validate(c(metric, { uuid: true })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.uuid is not of a type(s) string' ])

      expect(() => validate(c(metric, { uuid: 'a random string' })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.uuid does not match pattern "^[0-9a-fA-F]{4}([0-9a-fA-F]{4}-){4}[0-9a-fA-F]{12}$"' ])
    })

    it('should validate with a check uuid', () => {
      expect(validate(c(metric, { uuid: '01234567-89ab-cdef-0123-456789abcdef' })))
        .to.eql(c(valid, { uuid: '01234567-89ab-cdef-0123-456789abcdef' }))
      expect(validate(c(metric, { uuid: '01234567-89AB-CDEF-0123-456789ABCDEF' })))
        .to.eql(c(valid, { uuid: '01234567-89ab-cdef-0123-456789abcdef' }))
    })
  })

  /* ------------------------------------------------------------------------ */

  describe('Metric Names', () => {
    it('should not validate without a valid metric name', () => {
      expect(() => validate(c(metric).d('name')))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric requires property "name"' ])

      expect(() => validate(c(metric, { name: null })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.name is not of a type(s) string' ])

      expect(() => validate(c(metric, { name: true })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.name is not of a type(s) string' ])

      expect(() => validate(c(metric, { name: '' })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.name does not meet minimum length of 1' ])
    })

    it('should validate with a metric name', () => {
      expect(validate(c(metric, { name: 'what a beautiful world' })))
        .to.eql(c(valid, { name: 'what a beautiful world' }))
    })
  })

  /* ------------------------------------------------------------------------ */

  describe('Metric Values and Value Types', () => {
    it('should not validate without a valid metric value', () => {
      expect(() => validate(c(metric).d('value')))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric requires property "value"' ])

      expect(() => validate(c(metric, { value: { } })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.value is not of a type(s) number,string,boolean,null' ])

      expect(() => validate(c(metric, { value: null })))
        .to.throw(TypeError, 'Metric value and type can not both be null')

      expect(() => validate(c(metric, { value: true, type: 'number' })))
        .to.throw(TypeError, 'Metric specifies type as number but typeof value is string')

      expect(() => validate(c(metric, { value: 'string', type: 'number' })))
        .to.throw(TypeError, 'Metric specifies type as number but typeof value is string')

      expect(() => validate(c(metric, { value: 123, type: 'string' })))
        .to.throw(TypeError, 'Metric specifies type as string but typeof value is number')
    })

    it('should validate with a value', () => {
      expect(validate(c(metric, { value: 'this is a test string' })))
        .to.eql(c(valid, { value: 'this is a test string', type: 'string' }))
      expect(validate(c(metric, { value: 'this is a test string', type: 'string' })))
        .to.eql(c(valid, { value: 'this is a test string', type: 'string' }))

      expect(validate(c(metric, { value: true })))
        .to.eql(c(valid, { value: 'true', type: 'string' }))
      expect(validate(c(metric, { value: true, type: 'string' })))
        .to.eql(c(valid, { value: 'true', type: 'string' }))
      expect(validate(c(metric, { value: false })))
        .to.eql(c(valid, { value: 'false', type: 'string' }))
      expect(validate(c(metric, { value: false, type: 'string' })))
        .to.eql(c(valid, { value: 'false', type: 'string' }))

      expect(validate(c(metric, { value: 123.456 })))
        .to.eql(c(valid, { value: 123.456, type: 'number' }))
      expect(validate(c(metric, { value: 123.456, type: 'number' })))
        .to.eql(c(valid, { value: 123.456, type: 'number' }))

      expect(validate(c(metric, { value: -123.456 })))
        .to.eql(c(valid, { value: -123.456, type: 'number' }))
      expect(validate(c(metric, { value: -123.456, type: 'number' })))
        .to.eql(c(valid, { value: -123.456, type: 'number' }))
    })
  })

  /* ------------------------------------------------------------------------ */

  describe('Optional properties', () => {
    it('should correctly validate the check name', () => {
      expect(() => validate(c(metric, { checkName: null })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.checkName is not of a type(s) string' ])
      expect(() => validate(c(metric, { checkName: true })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.checkName is not of a type(s) string' ])
      expect(() => validate(c(metric, { checkName: '' })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.checkName does not meet minimum length of 1' ])

      expect(validate(c(metric, { checkName: 'the brown lazy fox' })))
        .to.eql(c(valid, { checkName: 'the brown lazy fox' }))
    })

    it('should correctly validate the account', () => {
      expect(() => validate(c(metric, { account: null })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.account is not of a type(s) number' ])
      expect(() => validate(c(metric, { account: true })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.account is not of a type(s) number' ])
      expect(() => validate(c(metric, { account: -1 })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.account must have a minimum value of 0' ])
      expect(() => validate(c(metric, { account: 0x7FFFFFFF + 1 })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.account must have a maximum value of 2147483647' ])

      expect(validate(c(metric, { account: 0 })))
        .to.eql(c(valid, { account: 0 }))
      expect(validate(c(metric, { account: 123 })))
        .to.eql(c(valid, { account: 123 }))
    })

    it('should correctly validate the stream tags', () => {
      expect(() => validate(c(metric, { tags: null })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.tags is not of a type(s) array' ])
      expect(() => validate(c(metric, { tags: [ null ] })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.tags[0] is not of a type(s) string' ])
      expect(() => validate(c(metric, { tags: [ 123 ] })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.tags[0] is not of a type(s) string' ])
      expect(() => validate(c(metric, { tags: [ 'foo' ] })))
        .to.throw(TypeError, 'Found 1 errors validating metric')
        .property('details').members([ 'metric.tags[0] does not match pattern "^[-`+A-Za-z0-9!@#\\\\$%^&\\"\'\\\\/\\\\?\\\\._]+:[-`+A-Za-z0-9!@#\\\\$%^&\\"\'\\\\/\\\\?\\\\._:=]+$"' ])
      expect(() => validate(c(metric, { tags: [ 123, 'foo' ] })))
        .to.throw(TypeError, 'Found 2 errors validating metric')
        .property('details').members([
          'metric.tags[1] does not match pattern "^[-`+A-Za-z0-9!@#\\\\$%^&\\"\'\\\\/\\\\?\\\\._]+:[-`+A-Za-z0-9!@#\\\\$%^&\\"\'\\\\/\\\\?\\\\._:=]+$"',
          'metric.tags[0] is not of a type(s) string',
        ])

      expect(validate(c(metric, { tags: [] })))
        .to.eql(c(valid, { tags: [] }))
      expect(validate(c(metric, { tags: [ 'foo:bar', '1:2' ] })))
        .to.eql(c(valid, { tags: [ 'foo:bar', '1:2' ] }))
    })
  })
})
