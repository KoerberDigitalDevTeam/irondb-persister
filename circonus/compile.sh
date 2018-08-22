#!/bin/bash

flatc --js --no-js-exports \
      metric.fbs \
      metric_batch.fbs \
      metric_common.fbs \
      metric_list.fbs

{
  echo "'use strict';"
  echo 'var circonus = circonus || {};'
  echo ''
  cat metric_common_generated.js \
      metric_generated.js \
      metric_batch_generated.js \
      metric_list_generated.js |
    grep -v 'var circonus = circonus || {};'
  echo 'module.exports = circonus;'
} > index.js

rm -f metric_common_generated.js \
      metric_generated.js \
      metric_batch_generated.js \
      metric_list_generated.js
