'use strict'

const expect = require('chai').expect
const client = require('../lib/client')
const { Metric, parse } = require('../metric')
const bodyParser = require('body-parser')

const uuid = 'd562b0f9-9068-4d01-880f-7df32b4bf9ad'
const timestamp = Date.now()

describe('Client Test', () => {
  let server = null, port = null, request = null

  before((done) => {
    let app = require('express')()

    app.use(bodyParser.raw({ type: '*/*' }))

    app.post('/raw', (req, res) => {
      let metrics = parse(req.body)
      if (! Array.isArray(metrics)) {
        console.log('Parsed body not an array')
        return res.sendStatus(500)
      }

      for (let metric of metrics) {
        if (! (metric instanceof Metric)) {
          console.log('Found a non-metric in array')
          return res.sendStatus
        }
      }

      request = metrics

      res.send(JSON.stringify({
        records: metrics.length,
        updated: 0,
        misdirected: 0,
        errors: 0,
      }))
    })

    server = app.listen(0, '127.0.0.1', () => {
      port = server.address().port
      process.stdout.write('    - ')
      client.init('127.0.0.1', port)
      done()
    }).on('error', done)
  })

  after((done) => {
    if (server && port) server.close(done)
    else done()
  })

  it('should connect and send a single metric', () => {
    return client.persist({
      timestamp,
      uuid,
      name: 'metricName',
      value: 'a value',
    }).then((result) => {
      expect(result).to.equal(1)
      expect(request).to.eql([ {
        timestamp,
        uuid,
        name: 'metricName',
        value: 'a value',
        type: 'string',
        accountId: 0,
        checkName: '',
        streamTags: [],
      } ])
    })
  })

  it('should connect and send an array of metrics', () => {
    return client.persist([ {
      timestamp,
      uuid,
      name: 'metricString',
      value: 'a value',
    }, {
      timestamp: timestamp + 1000,
      uuid,
      name: 'metricNumber',
      checkName: 'myName',
      value: 12345.6789,
      accountId: 999,
      streamTags: [ 'a:b', 'c:d' ],
    } ]).then((result) => {
      expect(result).to.equal(2)
      expect(request).to.eql([ {
        timestamp,
        uuid,
        name: 'metricString',
        value: 'a value',
        type: 'string',
        accountId: 0,
        checkName: '',
        streamTags: [],
      }, {
        timestamp: timestamp + 1000,
        uuid,
        name: 'metricNumber',
        value: 12345.6789,
        type: 'number',
        accountId: 999,
        checkName: 'myName',
        streamTags: [ 'a:b', 'c:d' ],
      } ])
    })
  })
})
