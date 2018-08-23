IronDB Persister
================

This projcet provides a very simple API to ingest RAW metric data into
IronDB using `flatbuffers`.

Ingesting metric data
---------------------

Ingesting data into a metric is as-easy-as specifying the self-explanatory
`IRONDB_HOST` and `IRONDB_PORT` environment variables and running the following:

```javascript
const irondb = require('irondb-persister')

irondb.persist({
    timestamp: Date.now(),
    uuid: '01234567-89ab-cdef-0123-456789abcdef',
    name: 'my_metric_name',
    value: ... ,
  })
```

Multiple metrics can be ingested in a single call:

```javascript
const irondb = require('irondb-persister')

irondb.persist([{
    timestamp: Date.now(),
    uuid: '01234567-89ab-cdef-0123-456789abcdef',
    name: 'my_metric_name',
    value: ... ,
  }, {
    timestamp: new Date().toISOString(),
    uuid: 'fedcba98-7654-3210-fedc-ba9876543210',
    name: 'another_metric',
    value: ... ,
  }])
```

A metric can be ingested by specifying the following required properties:

* `timestamp`: the timestamp of the data to persist, either as an ISO-8601
  formatted string or as the number of milliseconds from the epoch.<br>
  **NOTE**: if the number is less than 10000000000 (`1970-04-26T17:46:40.000Z`)
  then it will be considered to be the number of *seconds* from the epoch.
* `uuid`: the check UUID of the metric
* `name`: the metric name
* `value`: the value to persist, either a string, number or `null`

The following optional properties can also be specified:

* `type`: (either `number` or `string`) this is required when `value` is `null`
  in order to determine whether to ingest the *absent value* as a number or as
  a string
* `checkName`: the name to associate with the check
* `account`: (defaults to `0` *zero*) the number of the account to associate
  with the check
* `tags`: an array of `key:value` tags to associate with the check

Schema
------

A JSON schema for the metric is available in [schema.js](./metric/schema.js)

Other functions
---------------

The `irondb-persister` API exposes few other functions for fine-grained control

* `init(host, port)`: to initialize IronDB programmatically, withou requiring
  the presence of the two `IRONDB_HOST` and `IRONDB_PORT` environment variables.
* `parse(buffer)`: parse a *flatbuffer* into either a metric or array thereof.
* `serialize(metricOrArray)`: serialize a metric, or an array thereof into
  a `CIRM` or `CIRL` *flatbuffer*.
* `validate(metricOrArray)`: used before serialization per persistence, this
  validates that the metric (or array thereof) is syntactically correct

MIT License
-----------

Copyright 2018 Körber Digital GmbH

Permission is hereby granted, free of charge, to any person obtaining a copy of
this software and associated documentation files (the "Software"), to deal in
the Software without restriction, including without limitation the rights to
use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies
of the Software, and to permit persons to whom the Software is furnished to do
so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all
copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
SOFTWARE.


