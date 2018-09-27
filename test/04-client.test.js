const express = require('express')
const expect = require('chai').expect
const bodyParser = require('body-parser')

const { Metric, init, persist, parse } = require('..')

const uuid = 'd562b0f9-9068-4d01-880f-7df32b4bf9ad'
const timestamp = Date.now()

describe('Client Test', () => {
  let server = null, port = null, request = null

  before((done) => {
    let app = express()

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
      init('127.0.0.1', port)
      done()
    }).on('error', done)
  })

  after((done) => {
    if (server && port) server.close(done)
    else done()
  })

  it('should connect and send a single metric', () => {
    return persist({
      timestamp,
      uuid,
      name: 'metricName',
      value: 'a value',
    }).then((result) => {
      expect(result).to.eql({
        'records': 1,
        'updated': 0,
        'misdirected': 0,
        'errors': 0,
      })

      expect(request).to.eql([ {
        timestamp,
        uuid,
        name: 'metricName',
        value: 'a value',
        type: 'string',
        account: 0,
        checkName: '',
        tags: [],
      } ])
    })
  })

  it('should connect and send an array of metrics', () => {
    return persist([ {
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
      account: 999,
      tags: [ 'a:b', 'c:d' ],
    } ]).then((result) => {
      expect(result).to.eql({
        'records': 2,
        'updated': 0,
        'misdirected': 0,
        'errors': 0,
      })

      expect(request).to.eql([ {
        timestamp,
        uuid,
        name: 'metricString',
        value: 'a value',
        type: 'string',
        account: 0,
        checkName: '',
        tags: [],
      }, {
        timestamp: timestamp + 1000,
        uuid,
        name: 'metricNumber',
        value: 12345.6789,
        type: 'number',
        account: 999,
        checkName: 'myName',
        tags: [ 'a:b', 'c:d' ],
      } ])
    })
  })
})
