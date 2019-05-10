'use strict'

const http = require('http')
const serialize = require('../metric').serialize

/* Initialization of our environment */
let db_host, db_port, initialized = false
const timeout = parseInt(process.env.IRONDB_TIMEOUT) || 60000

function init(host, port) {
  db_host = host || process.env.IRONDB_HOST
  db_port = port || parseInt(process.env.IRONDB_PORT) || 8112
  if (! db_host) throw new Error('Missing IRONDB_HOST environment variable')
  console.log(`IRONdb initialized with host=${db_host}, port=${db_port}, timeout=${timeout}`)
  initialized = true
}

/* Persist an array of metrics */
function persist(metrics, callback) {
  /* Wrap into a promise if we don't have a callback function */
  if (typeof callback !== 'function') {
    return new Promise((resolve, reject) => {
      persist(metrics, (error, result) => {
        if (error) reject(error)
        else resolve(result)
      })
    })
  }

  try {
    /* Initialize if not done before */
    if (! initialized) init()

    /* Convert our metrics into a buffer */
    let buffer = null, length = null

    if (Array.isArray(metrics)) {
      if (metrics.length == 0) {
        console.warn('No datapoints to persist')
        return callback(null, 0)
      } else {
        buffer = serialize(metrics)
        length = metrics.length
      }
    } else if ((metrics != null) && (typeof metrics === 'object')) {
      buffer = serialize([ metrics ])
      length = 1
    } else if (metrics == null) {
      throw new Error('Unable to serialize null metrics')
    } else {
      throw new Error('Unable to serialize a ' + typeof metrics)
    }

    /* Minimal dependency, do HTTP request manually */
    let req = http.request({
      hostname: db_host,
      port: db_port,
      path: '/raw',
      method: 'POST',
    })

    /* HTTP timeout */
    req.setTimeout(timeout)

    /* Socket timeout */
    req.on('socket', (socket) => {
      socket.setTimeout(timeout)
      socket.on('timeout', () => req.abort())
    })

    /* On errors, we fail */
    req.on('error', (err) => {
      callback(err)
    })

    /* Response handler */
    req.on('response', (res) => {
      let buffers = []
      res.on('data', (chunk) => buffers.push(chunk))
      res.on('end', () => {
        /* Status code must be 200 */
        if (res.statusCode != 200) {
          return callback(new Error(res.statusCode + ' - ' + res.statusMessage))
        }

        /* Parse the response body */
        let body = Buffer.concat(buffers).toString()
        try {
          body = JSON.parse(body)
        } catch (error) {
          return callback(new Error('Error parsing response: ' + body))
        }

        /* Parse */
        if (body.errors == 0) return callback(null, body)
        callback(new Error(`Error ingesting ${body.errors} metrics`))
      })
    })

    /* Send out our request */
    req.setHeader('X-Snowth-Datapoints', length)
    req.setHeader('Content-Length', buffer.length)
    req.setHeader('Content-Type', 'application/x-circonus-metric-list-flatbuffer')
    req.write(buffer)
    req.end()
  } catch (error) {
    callback(error)
  }
}

/* ========================================================================== *
 * Final exports and logging                                                  *
 * ========================================================================== */
module.exports = { persist, init }
