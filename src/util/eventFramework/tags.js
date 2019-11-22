/*****
 License
 --------------
 Copyright © 2017 Bill & Melinda Gates Foundation
 The Mojaloop files are made available by the Bill & Melinda Gates Foundation under the Apache License, Version 2.0 (the "License") and you may not use these files except in compliance with the License. You may obtain a copy of the License at
 http://www.apache.org/licenses/LICENSE-2.0
 Unless required by applicable law or agreed to in writing, the Mojaloop files are distributed on an "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the License for the specific language governing permissions and limitations under the License.
 Contributors
 --------------
 This is the official list of the Mojaloop project contributors for this file.
 Names of the original copyright holders (individuals or organizations)
 should be listed with a '*' in the first column. People who have
 contributed from an organization can be listed under the organization
 that actually holds the copyright for their contributions (see the
 Gates Foundation organization for an example). Those individuals should have
 their names indented and be marked with a '-'. Email address can be added
 optionally within square brackets <email>.
 * Gates Foundation

 * Neal Donnan <neal.donnan@modusbox.com>
 * Valentin Genev <valentin.genev@modusbox.com>

 --------------
 ******/

const Enum = require('../../enums')
const _ = require('lodash')

/**
 * Method to get span tags
 *
 * @param payload message payload
 * @param headers message headers
 * @param params message params
 * @param transactionType type of the transaction
 * @param transactionAction transaction type action
 * @returns tags object to be applied to a span
 */

const getTransferSpanTags = ({ payload, headers, params }, transactionType, transactionAction) => {
  const headersLowerCase = _.mapKeys(headers, function (v, k) { return k.toLowerCase() })
  const tags = {
    transactionType,
    transactionAction,
    transactionId: (payload && payload.transferId) || (params && params.id),
    source: headersLowerCase[Enum.Http.Headers.FSPIOP.SOURCE],
    destination: headersLowerCase[Enum.Http.Headers.FSPIOP.DESTINATION]
  }
  if (payload && payload.payerFsp && payload.payeeFsp) {
    return {
      ...tags,
      payerFsp: payload.payerFsp,
      payeeFsp: payload.payeeFsp
    }
  } else {
    return tags
  }
}

const getSpanTags = (transactionType, transactionAction, transactionId, source, destination) => {
  return {
    transactionType,
    transactionAction,
    transactionId,
    source,
    destination
  }
}

module.exports = {
  getTransferSpanTags,
  getSpanTags
}
