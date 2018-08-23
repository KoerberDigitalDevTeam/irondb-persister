'use strict'

const flatbuffers = require('flatbuffers').flatbuffers

const Metric = require('./metric.js')
const validate = require('./validate')
const circonus = require('../circonus')

/* ========================================================================== */

function createString(builder, string) {
  let map = builder.__stringCacheMap
  if (map == null) map = builder.__stringCacheMap = new Map()

  if (map.has(string)) return map.get(string)

  let offset = builder.createString(string)
  map.set(string, offset)
  return offset
}

/* ========================================================================== */

function serializeMetric(metric, builder) {
  // Timestamp is used by both Metric and MetricValue, serialize it first
  let timestamp = metric.timestamp || 0
  let timestampLow = timestamp % 0x100000000
  let timestampHigh = ( timestamp - timestampLow ) / 0x100000000
  let timestampOffset = builder.createLong(timestampLow, timestampHigh)

  /* ------------------------------------------------------------------------ *
   * table MetricValue {                                                      *
   *       name: string (id: 0);                                              *
   *       timestamp: ulong (id: 1);                                          *
   *       // Skips to 3 because the _type field of the union occupies 2      *
   *       value: MetricValueUnion (id: 3);                                   *
   *       generation: short = 0 (id: 4);                                     *
   *       stream_tags: [string] (id: 5);                                     *
   * }                                                                        *
   * ------------------------------------------------------------------------ */

  // name: string (id: 0)
  let metricValueNameOffset = createString(builder, metric.name)

  // valueType: _type (id: 2)
  // value: MetricValueUnion (id: 3)
  let metricValueOffset = null, metricValueType = null
  if (metric.type === 'number') {
    if (metric.value == null) {
      metricValueType = circonus.MetricValueUnion.AbsentNumericValue
      circonus.AbsentNumericValue.startAbsentNumericValue(builder)
      metricValueOffset = circonus.AbsentNumericValue.endAbsentNumericValue(builder)
    } else {
      metricValueType = circonus.MetricValueUnion.DoubleValue
      circonus.DoubleValue.startDoubleValue(builder)
      circonus.DoubleValue.addValue(builder, metric.value)
      metricValueOffset = circonus.DoubleValue.endDoubleValue(builder)
    }
  } else if (metric.type === 'string') {
    if (metric.value == null) {
      metricValueType = circonus.MetricValueUnion.AbsentStringValue
      circonus.AbsentStringValue.startAbsentStringValue(builder)
      metricValueOffset = circonus.AbsentStringValue.endAbsentStringValue(builder)
    } else {
      metricValueType = circonus.MetricValueUnion.StringValue
      let offset = createString(builder, metric.value)
      circonus.StringValue.startStringValue(builder)
      circonus.StringValue.addValue(builder, offset)
      metricValueOffset = circonus.StringValue.endStringValue(builder)
    }
  } else {
    throw new TypeError(`Unsupported metric value type ${metric.type}`)
  }

  // stream_tags: [string] (id: 5)
  let streamTagsOffset = null
  if ((metric.streamTags != null) && (metric.streamTags.length > 0)) {
    streamTagsOffset = circonus.MetricValue.createStreamTagsVector(builder,
      (metric.streamTags || []).reduce((array, tag, index) => {
        let tagOffset = createString(builder, tag)
        array.push(tagOffset)
        return array
      }, [])
    )
  }

  // table MetricValue
  circonus.MetricValue.startMetricValue(builder)
  circonus.MetricValue.addName(builder, metricValueNameOffset) // string (id: 0)
  circonus.MetricValue.addTimestamp(builder, timestampOffset) // ulong (id: 1)
  circonus.MetricValue.addValueType(builder, metricValueType) // _type (id: 2)
  circonus.MetricValue.addValue(builder, metricValueOffset) // MetricValueUnion (id: 3)
  circonus.MetricValue.addGeneration(builder, 0) // short = 0 (id: 4)

  if (streamTagsOffset != null) {
    circonus.MetricValue.addStreamTags(builder, streamTagsOffset) // [string] (id: 5)
  }

  let valueOffset = circonus.MetricValue.endMetricValue(builder)

  /* ------------------------------------------------------------------------ *
   * table Metric {                                                           *
   *       timestamp: ulong (id: 0);                                          *
   *       check_name: string (id: 1);                                        *
   *       check_uuid: string (id: 2);                                        *
   *       account_id: int (id: 3);                                           *
   *       value: MetricValue (id: 4);                                        *
   * }                                                                        *
   * ------------------------------------------------------------------------ */

  // string (id: 1)
  let checkNameOffset = createString(builder, metric.checkName || '')

  // string (id: 2)
  let checkUuidOffset = createString(builder, metric.uuid)

  // table Metric
  circonus.Metric.startMetric(builder)
  circonus.Metric.addTimestamp(builder, timestampOffset) // ulong (id: 0)
  circonus.Metric.addCheckName(builder, checkNameOffset) // string (id: 1)
  circonus.Metric.addCheckUuid(builder, checkUuidOffset) // string (id: 2)
  circonus.Metric.addAccountId(builder, metric.accountId || 0) // int (id: 3)
  circonus.Metric.addValue(builder, valueOffset) // MetricValue (id: 4)
  let metricOffset = circonus.Metric.endMetric(builder)

  // All done!
  return metricOffset
}

function serialize(what) {
  if (Array.isArray(what)) {
    let builder = new flatbuffers.Builder(1024)

    let offsets = circonus.MetricList.createMetricsVector(builder,
      what.reduce((array, metric, index) => {
        if (! (metric instanceof Metric)) metric = validate(metric)
        let offset = serializeMetric(metric, builder)
        array.push(offset)
        return array
      }, [])
    )

    circonus.MetricList.startMetricList(builder)
    circonus.MetricList.addMetrics(builder, offsets)
    let list = circonus.MetricList.endMetricList(builder)

    circonus.MetricList.finishMetricListBuffer(builder, list)

    return Buffer.from(builder.asUint8Array())
  } else if (what instanceof Metric) {
    let builder = new flatbuffers.Builder(1024)
    let offset = serializeMetric(what, builder)

    circonus.Metric.finishMetricBuffer(builder, offset)

    return Buffer.from(builder.asUint8Array())
  } else {
    return serialize(validate(what))
  }
}

module.exports = serialize
