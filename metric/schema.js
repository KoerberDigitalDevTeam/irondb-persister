'use strict'

const UUID_RE = /^[0-9a-fA-F]{4}([0-9a-fA-F]{4}-){4}[0-9a-fA-F]{12}$/
const TAG_RE = /^[-`+A-Za-z0-9!@#\$%^&"'\/\?\._]+:[-`+A-Za-z0-9!@#\$%^&"'\/\?\._:=]+$/

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

module.exports = Object.freeze({
  id: '/Metric',
  type: 'object',
  properties: {

    // REQUIRED PROPERTIES

    // timestamp must be a number (milliseconds from epoch) or an
    // ISO-8601 formatted date-time "2012-07-08T16:41:41.532Z" string.
    // As convenience, if the value is a number less than 10000000000
    // (1970-04-26T17:46:40.000Z), then it's considered to be SECONDS
    // from the epoch and henceforth multiplied by 1000
    timestamp: {
      type: [ 'number', 'string' ],
      format: 'date-time',
      minimum: 0, // 1970-01-01T00:00:00.000Z
      maximum: 253402300799999, // 9999-12-31T23:59:59.999Z
    },

    // the check UUID, must always be present
    uuid: { type: 'string', pattern: UUID_RE.source },

    // This represents the metric name, and must always be present
    name: {
      type: 'string',
      minLength: 1,
    },

    // The value can be a number, a string or "null". In the latter case,
    // the property type must also be specified
    value: {
      type: [ 'number', 'string', 'boolean', 'null' ],
    },

    // OPTIONAL PROPERTIES

    // the check name is a textual (human-readable) string associated
    // with the check UUID. If specified it needs to be at least 1 char
    checkName: {
      type: 'string',
      minLength: 1,
    },

    // the account ID, if unspecified, will default to ZERO (0)
    accountId: {
      type: 'number',
      minimum: 0,
      maximum: 0x7FFFFFFF,
      default: 0,
    },

    // The value type is optional if value is specified (it will be derived
    // from the type of the value itself. If the value is not specified, then
    // this property MUST be specified. Note that histograms are not supported
    type: {
      enum: [ 'number', 'string' ],
    },

    // Stream tags to associate with this metric
    streamTags: {
      type: 'array',
      items: {
        type: 'string',
        pattern: TAG_RE.source,
        maxLength: 256,
      },
    },
  },

  // We always require timestamp, uuid and value
  required: [ 'timestamp', 'uuid', 'name', 'value' ],

  // No additional properties are allowed
  additionalProperties: false,
})
