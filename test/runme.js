/* ========================================================================== *
 * INGEST SOME DATA                                                           *
 * -------------------------------------------------------------------------- *
 * This is a useless little client ingesting numeric and string data into a   *
 * irondb check/metric, in order to test end-to-end communication...          *
 * ========================================================================== */

const { persist } = require('..')

const uuid = '00000000-0000-0000-0000-000000000001'
const array = 'abcdefghijklmnopqrstuvwxyz'.split('')

/* Asynchronous function ingesting every second */
async function runTest() {
  // Timestamp
  const now = Date.now()
  // Numeric value is the number of minutes in the hour
  const sec = Math.floor(now / 60000) % 60
  // String value is a letter, changed every minute
  const str = array[Math.floor(now / 60000) % array.length]

  // Wait for IronDB to persist data
  let result = await persist([ {
    uuid,
    timestamp: now,
    name: 'string_metric_name',
    value: str,
  }, {
    uuid,
    timestamp: now,
    name: 'numeric_metric_name',
    value: sec,
  } ])

  // If we have no exceptions, dump and repeat in 1 second
  console.log(now, { now, sec, str }, result)
  setTimeout(runTest, 1000)
}

/* Run the test */
runTest()
