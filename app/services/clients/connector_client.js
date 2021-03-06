'use strict'

const logger = require('../../utils/logger')(__filename)
const baseClient = require('./base_client/base_client')
const requestLogger = require('../../utils/request_logger')

// Constants
const SERVICE_NAME = 'connector'

const WALLET_AUTH_PATH = '/v1/frontend/charges/{chargeId}/wallets/{provider}'
const CARD_AUTH_PATH = '/v1/frontend/charges/{chargeId}/cards'
const CARD_3DS_PATH = '/v1/frontend/charges/{chargeId}/3ds'
const CARD_STATUS_PATH = '/v1/frontend/charges/{chargeId}/status'
const CARD_CAPTURE_PATH = '/v1/frontend/charges/{chargeId}/capture'
const CARD_CANCEL_PATH = '/v1/frontend/charges/{chargeId}/cancel'
const CARD_FIND_BY_TOKEN_PATH = '/v1/frontend/tokens/{chargeTokenId}'
const TOKEN_USED_PATH = '/v1/frontend/tokens/{chargeTokenId}/used'
const CARD_CHARGE_PATH = '/v1/frontend/charges/{chargeId}'
const WORLDPAY_3DS_FLEX_JWT_PATH = '/v1/frontend/charges/{chargeId}/worldpay/3ds-flex/ddc'

let baseUrl
let correlationId

/** @private */
const _getFindChargeUrlFor = chargeId => baseUrl + CARD_CHARGE_PATH.replace('{chargeId}', chargeId)

/** @private */
const _getAuthUrlFor = chargeId => baseUrl + CARD_AUTH_PATH.replace('{chargeId}', chargeId)

/** @private */
const _getWalletAuthUrlFor = (chargeId, provider) => baseUrl + WALLET_AUTH_PATH.replace('{chargeId}', chargeId).replace('{provider}', provider)

/** @private */
const _getThreeDsFor = chargeId => baseUrl + CARD_3DS_PATH.replace('{chargeId}', chargeId)

/** @private */
const _getUpdateStatusUrlFor = chargeId => baseUrl + CARD_STATUS_PATH.replace('{chargeId}', chargeId)

/** @private */
const _getCaptureUrlFor = chargeId => baseUrl + CARD_CAPTURE_PATH.replace('{chargeId}', chargeId)

/** @private */
const _getCancelUrlFor = chargeId => baseUrl + CARD_CANCEL_PATH.replace('{chargeId}', chargeId)

/** @private */
const _getFindByTokenUrlFor = tokenId => baseUrl + CARD_FIND_BY_TOKEN_PATH.replace('{chargeTokenId}', tokenId)

/** @private */
const _markUsedTokenUrl = tokenId => baseUrl + TOKEN_USED_PATH.replace('{chargeTokenId}', tokenId)

/** @private */
const _getPatchUrlFor = chargeId => baseUrl + CARD_CHARGE_PATH.replace('{chargeId}', chargeId)

/** @private */
const _getWorldpay3dsFlexUrlFor = chargeId => baseUrl + WORLDPAY_3DS_FLEX_JWT_PATH.replace('{chargeId}', chargeId)

/** @private */
const _putConnector = (url, payload, description, subSegment, loggingFields = {}) => {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    const context = {
      ...loggingFields,
      url: url,
      method: 'PUT',
      description: description,
      service: SERVICE_NAME
    }
    requestLogger.logRequestStart(context, loggingFields)
    baseClient.put(
      url,
      { payload, correlationId },
      null,
      subSegment
    ).then(response => {
      logger.info('PUT to %s ended - total time %dms', url, new Date() - startTime, loggingFields)
      resolve(response)
    }).catch(err => {
      logger.info('PUT to %s ended - total time %dms', url, new Date() - startTime, loggingFields)
      logger.error('Calling connector threw exception', {
        ...loggingFields,
        service: 'connector',
        method: 'PUT',
        url: url,
        error: err
      })
      reject(err)
    })
  })
}

/** @private */
const _postConnector = (url, payload, description, loggingFields = {}) => {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    const context = {
      url: url,
      method: 'POST',
      description: description,
      service: SERVICE_NAME
    }
    requestLogger.logRequestStart(context, loggingFields)
    baseClient.post(
      url,
      { payload, correlationId },
      null,
      null
    ).then(response => {
      logger.info('POST to %s ended - total time %dms', url, new Date() - startTime, loggingFields)
      resolve(response)
    }).catch(err => {
      logger.info('POST to %s ended - total time %dms', url, new Date() - startTime, loggingFields)
      logger.error('Calling connector threw exception', {
        ...loggingFields,
        service: 'connector',
        method: 'POST',
        url: url,
        error: err
      })
      reject(err)
    })
  })
}

/** @private */
const _patchConnector = (url, payload, description, loggingFields = {}) => {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    const context = {
      url: url,
      method: 'PATCH',
      description: description,
      service: SERVICE_NAME
    }
    requestLogger.logRequestStart(context, loggingFields)
    baseClient.patch(
      url,
      { payload, correlationId },
      null,
      null
    ).then(response => {
      logger.info('PATCH to %s ended - total time %dms', url, new Date() - startTime, loggingFields)
      resolve(response)
    }).catch(err => {
      logger.info('PATCH %s to %s ended - total time %dms', url, new Date() - startTime, loggingFields)
      logger.error('Calling connector threw exception', {
        ...loggingFields,
        service: 'connector',
        method: 'PATCH',
        url: url,
        error: err
      })
      reject(err)
    })
  })
}

/** @private */
const _getConnector = (url, description, loggingFields = {}) => {
  return new Promise(function (resolve, reject) {
    const startTime = new Date()
    const context = {
      url: url,
      method: 'GET',
      description: description,
      service: SERVICE_NAME
    }
    requestLogger.logRequestStart(context, loggingFields)
    baseClient.get(
      url,
      { correlationId },
      null,
      null
    ).then(response => {
      logger.info('GET to %s ended - total time %dms', url, new Date() - startTime, loggingFields)
      if (response.statusCode !== 200) {
        logger.warn('Calling connector to GET something returned a non http 200 response', correlationId, {
          ...loggingFields,
          service: 'connector',
          method: 'GET',
          status_code: response.statusCode
        })
      }
      resolve(response)
    }).catch(err => {
      logger.info('GET to %s ended - total time %dms', url, new Date() - startTime, loggingFields)
      logger.error('Calling connector threw exception', {
        ...loggingFields,
        service: 'connector',
        method: 'GET',
        url: url,
        error: err
      })
      reject(err)
    })
  })
}

// POST functions
const threeDs = (chargeOptions, loggingFields = {}) => {
  const threeDsUrl = _getThreeDsFor(chargeOptions.chargeId)
  return _postConnector(threeDsUrl, chargeOptions.payload, '3ds', loggingFields)
}

const chargeAuth = (chargeOptions, loggingFields = {}) => {
  const authUrl = _getAuthUrlFor(chargeOptions.chargeId)
  return _postConnector(authUrl, chargeOptions.payload, 'create charge', loggingFields)
}

const chargeAuthWithWallet = (chargeOptions, loggingFields = {}) => {
  const authUrl = _getWalletAuthUrlFor(chargeOptions.chargeId, chargeOptions.provider)
  return _postConnector(authUrl, chargeOptions.payload, 'create charge using e-wallet payment', loggingFields)
}

const capture = (chargeOptions, loggingFields = {}) => {
  const captureUrl = _getCaptureUrlFor(chargeOptions.chargeId)
  return _postConnector(captureUrl, null, 'do capture', loggingFields)
}

const cancel = (chargeOptions, loggingFields = {}) => {
  const cancelUrl = _getCancelUrlFor(chargeOptions.chargeId)
  return _postConnector(cancelUrl, null, 'cancel charge', loggingFields)
}

// PUT functions
const updateStatus = (chargeOptions, subSegment, loggingFields = {}) => {
  const updateStatusUrl = _getUpdateStatusUrlFor(chargeOptions.chargeId)
  return _putConnector(updateStatusUrl, chargeOptions.payload, 'update status', subSegment, loggingFields)
}

// PATCH functions
const patch = (chargeOptions, loggingFields = {}) => {
  const patchUrl = _getPatchUrlFor(chargeOptions.chargeId)
  return _patchConnector(patchUrl, chargeOptions.payload, 'patch', loggingFields)
}

// GET functions
const findCharge = (chargeOptions, loggingFields = {}) => {
  const findChargeUrl = _getFindChargeUrlFor(chargeOptions.chargeId)
  return _getConnector(findChargeUrl, 'find charge', loggingFields)
}

const findByToken = (chargeOptions, loggingFields = {}) => {
  const findByTokenUrl = _getFindByTokenUrlFor(chargeOptions.tokenId)
  return _getConnector(findByTokenUrl, 'find by token', loggingFields)
}

const getWorldpay3dsFlexJwt = (chargeOptions, loggingFields = {}) => {
  const getWorldpay3dsFlexJwtUrl = _getWorldpay3dsFlexUrlFor(chargeOptions.chargeId)
  return _getConnector(getWorldpay3dsFlexJwtUrl, 'get Worldpay 3DS Flex DDC JWT', loggingFields)
}

const markTokenAsUsed = (chargeOptions, loggingFields = {}) => {
  const markUsedTokenUrl = _markUsedTokenUrl(chargeOptions.tokenId)
  return _postConnector(markUsedTokenUrl, undefined, 'mark token as used', loggingFields)
}

module.exports = function (clientOptions = {}) {
  baseUrl = clientOptions.baseUrl || process.env.CONNECTOR_HOST
  correlationId = clientOptions.correlationId || ''
  return {
    chargeAuth,
    chargeAuthWithWallet,
    threeDs,
    updateStatus,
    findCharge,
    capture,
    cancel,
    findByToken,
    patch,
    markTokenAsUsed,
    getWorldpay3dsFlexJwt
  }
}
