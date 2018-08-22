'use strict'

const flatbuffers = require('flatbuffers').flatbuffers
const circonus = require('../circonus')
const { Metric, MetricList } = require('./classes.js')

/* ========================================================================== *
 * We destructure the two flatbuffer tables listed below into a single object *
 * containing both metric *AND* metric value                                  *
 *                                                                            *
 * table MetricValue {                                                        *
 *       name: string (id: 0);                                                *
 *       timestamp: ulong (id: 1);                                            *
 *       // Skips to 3 because the _type field of the union occupies 2        *
 *       value: MetricValueUnion (id: 3);                                     *
 *       generation: short = 0 (id: 4);                                       *
 *       stream_tags: [string] (id: 5);                                       *
 * }                                                                          *
 *                                                                            *
 * table Metric {                                                             *
 *       timestamp: ulong (id: 0);                                            *
 *       check_name: string (id: 1);                                          *
 *       check_uuid: string (id: 2);                                          *
 *       account_id: int (id: 3);                                             *
 *       value: MetricValue (id: 4);                                          *
 * }                                                                          *
 * ========================================================================== */

function parseMetric(metric) {
  let timestamp = metric.timestamp()
  let checkName = metric.checkName()
  let checkUuid = metric.checkUuid()
  let accountId = metric.accountId()

  // Get the wrapper to for the metric value
  let metricValue = metric.value()
  if (! metricValue) throw new TypeError('No metric value in buffer')

  // Values in the metric value
  let name = metricValue.name()
  let metricTimestamp = metricValue.timestamp()
  let metricValueType = metricValue.valueType()

  // Generation and check
  let generation = metricValue.generation()
  if (generation != 0) throw new TypeError(`Unsupported generation ${generation}`)

  // Extract our stream tags
  let length = metricValue.streamTagsLength(), streamTags = []
  for (let i = 0; i < length; i ++) streamTags.push(metricValue.streamTags(i))
  if (length == 0) streamTags = null

  // Parse the metricValue from MetricValueUnion
  let type = null, value = null
  switch (metricValueType) {
    case circonus.MetricValueUnion.IntValue:
      value = metricValue.value(new circonus.IntValue())
      value = value == null ? null : value.value()
      type = 'number'
      break

    case circonus.MetricValueUnion.UintValue:
      value = metricValue.value(new circonus.UintValue())
      value = value == null ? null : value.value()
      type = 'number'
      break

    case circonus.MetricValueUnion.LongValue:
      value = metricValue.value(new circonus.LongValue())
      value = value == null ? null : value.value()
      value = value == null ? null : value.toFloat64()
      type = 'number'
      break

    case circonus.MetricValueUnion.UlongValue:
      value = metricValue.value(new circonus.UlongValue())
      value = value == null ? null : value.value()
      value = value == null ? null : value.toFloat64()
      type = 'number'
      break

    case circonus.MetricValueUnion.DoubleValue:
      value = metricValue.value(new circonus.DoubleValue())
      value = value == null ? null : value.value()
      type = 'number'
      break

    case circonus.MetricValueUnion.StringValue:
      value = metricValue.value(new circonus.StringValue())
      value = value == null ? null : value.value()
      type = 'string'
      break

    case circonus.MetricValueUnion.AbsentNumericValue:
      type = 'number'
      value = null
      break

    case circonus.MetricValueUnion.AbsentStringValue:
      type = 'string'
      value = null
      break

    case circonus.MetricValueUnion.Histogram:
    case circonus.MetricValueUnion.AbsentHistogramValue:
      throw new TypeError('Histograms not supported')

    default:
      throw new TypeError(`Unknown MetricValueUnion type ${metricValueType}`)
  }

  // Normalise timestamps
  if (timestamp != null) timestamp = timestamp.toFloat64()
  if (metricTimestamp != null) timestamp = metricTimestamp.toFloat64()

  // Return our parsed metric
  let values = {
    timestamp: timestamp || 0,
    uuid: checkUuid == null ? null : checkUuid.toLowerCase(),
    name: name == null ? null : name ? name : null,
    value: value,
    type: type,
    accountId: accountId || 0,
  }

  // Optional properties
  checkName = checkName == null ? null : checkName ? checkName : null
  if (checkName) values.checkName = checkName
  if (streamTags) values.streamTags = streamTags

  // Wrap our metric
  return new Metric(values)
}

function parseList(list) {
  const length = list.metricsLength()

  const metrics = []
  for (let i = 0; i < length; i ++) {
    let metric = list.metrics(i)
    metrics.push(parseMetric(metric))
  }

  return new MetricList(metrics)
}

function parse(buffer) {
  if (! Buffer.isBuffer(buffer)) throw new TypeError('Not a buffer')

  const bytes = new flatbuffers.ByteBuffer(buffer)

  if (circonus.Metric.bufferHasIdentifier(bytes)) {
    let metric = circonus.Metric.getRootAsMetric(bytes)
    return parseMetric(metric)
  }

  if (circonus.MetricList.bufferHasIdentifier(bytes)) {
    let list = circonus.MetricList.getRootAsMetricList(bytes)
    return parseList(list)
  }

  throw new TypeError('Unknown buffer type')
}

module.exports = parse
