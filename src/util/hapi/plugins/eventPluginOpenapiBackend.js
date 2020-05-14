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
 * Name Surname <name.surname@gatesfoundation.com>

 * Rajiv Mothilal <rajiv.mothilal@modusbox.com>
 --------------
 ******/
'use strict'

const EventSdk = require('@mojaloop/event-sdk')
const Logger = require('@mojaloop/central-services-logger')
const Enum = require('../../../enums')
const onPreResponse = require('./eventPlugin').onPreResponse

const onPreAuth = (request, reply) => {
  if (request) {
    const operation = request.server.plugins.openapi.openapi.matchOperation({
      method: request.method,
      path: request.path,
      body: request.payload,
      query: request.query,
      headers: request.headers
    })

    if (operation && operation.operationId) {
      if (operation.tags && operation.tags.includes(Enum.Tags.RouteTags.SAMPLED)) {
        const context = EventSdk.Tracer.extractContextFromHttpRequest(request)
        const spanName = operation.operationId
        let span
        if (context) {
          span = EventSdk.Tracer.createChildSpanFromContext(spanName, context)
        } else {
          Logger.isDebugEnabled && Logger.debug(`Starting parent span ${spanName}`)
          span = EventSdk.Tracer.createSpan(spanName)
        }
        reply.request.span = span
      }
      const parsedRequest = request.server.plugins.openapi.openapi.router.parseRequest({
        method: request.method,
        path: request.path,
        body: request.payload,
        query: request.query,
        headers: request.headers
      }, request.server.plugins.openapi.openapi.getOperation(operation.operationId))
      reply.request.params = parsedRequest.params || {}
    }
  }
  return reply.continue
}

/**
 * HAPI plugin to start and stop a parent span on API requests.
 * In order to have a span created for a route the 'sampled' tag should be
 * applied to the route
 */
module.exports.plugin = {
  name: 'eventPlugin',
  register: function (server) {
    server.ext('onPreAuth', onPreAuth)
    server.ext('onPreResponse', onPreResponse)
  }
}
