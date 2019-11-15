/* eslint-disable */
const sinon = require('sinon')
const { expect } = require('chai')

const mockRequest = {
  method: 'GET',
  body: {},
  route: { methods: { get: true } },
  headers: {}
}

const requireHelper = function requireHelper (module) {
  delete require.cache[require.resolve(module)]
  return require(module)
}

describe('CSP middleware', () => {
  it('should not set the Content-Security-Policy header if the feature is switched off', () => {
    process.env.CSP_SEND_HEADER = 'false'
    const csp = requireHelper('../../app/middleware/csp')

    const next = sinon.spy()
    const response = { setHeader: sinon.spy() }
    csp(mockRequest, response, next)

    expect(next.called).to.be.true
    expect(response.setHeader.called).to.be.false
  })

  it('should set the Content-Security-Policy header if the feature is switched on', () => {
    process.env.CSP_SEND_HEADER = 'true'
    const csp = requireHelper('../../app/middleware/csp')

    const next = sinon.spy()
    const response = { setHeader: sinon.spy() }
    csp(mockRequest, response, next)

    expect(next.called).to.be.true
    expect(response.setHeader.called).to.be.true
  })

  it('should set Report-Only on Content-Security-Policy if enforce policy is switched off', () => {
    process.env.CSP_SEND_HEADER = 'true'
    process.env.CSP_ENFORCE = 'false'
    const csp = requireHelper('../../app/middleware/csp')

    const next = sinon.spy()
    const response = { setHeader: sinon.spy() }
    csp(mockRequest, response, next)

    sinon.assert.calledWith(response.setHeader, 'Content-Security-Policy-Report-Only')
  })

  it('should set Report-Only on Content-Security-Policy if enforce policy is switched on', () => {
    process.env.CSP_SEND_HEADER = 'true'
    process.env.CSP_ENFORCE = 'true'
    const csp = requireHelper('../../app/middleware/csp')

    const next = sinon.spy()
    const response = { setHeader: sinon.spy() }
    csp(mockRequest, response, next)

    sinon.assert.calledWith(response.setHeader, 'Content-Security-Policy')
  })
})
