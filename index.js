'use strict'

const flatbuffers = require('flatbuffers').flatbuffers
const circonus = require('./circonus')
const models = require('./models')

function parse(bytes) {
  if (! Buffer.isBuffer(bytes)) throw new TypeError('Must specify a Buffer')
  const buffer = new flatbuffers.ByteBuffer(bytes)

  if (circonus.MetricList.bufferHasIdentifier(buffer)) {
    const metricList = circonus.MetricList.getRootAsMetricList(buffer)
    return new models.MetricList(metricList)
  }

  throw new TypeError('Unknown identifier in buffer')
}

module.exports = {
  parse,
}
