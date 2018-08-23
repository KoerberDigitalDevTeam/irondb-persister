'use strict'

const expect = require('chai').expect

describe('IronDB Object', () => {
  it('should have the required methods', () => {
    let irondb = require('..')

    expect(irondb).to.be.an('object')

    expect(irondb.Metric).to.be.a('function')

    expect(irondb.init).to.be.a('function')
    expect(irondb.persist).to.be.a('function')

    expect(irondb.parse).to.be.a('function')
    expect(irondb.validate).to.be.a('function')
    expect(irondb.serialize).to.be.a('function')
  })
})

