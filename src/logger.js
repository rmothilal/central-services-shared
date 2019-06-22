'use strict'

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, colorize, printf } = format
const level = process.env.LOG_LEVEL || 'info'
const DefaultEventLogger = require('@mojaloop/event-sdk').DefaultEventLogger

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`
})

// TODO need to figure out how to get the logger to choose a mode i.e. if you want either grpc or normal or both
// let grpcLogging = false
// let normalLogging = false

let grpcLogger

const customLevels = {
  TRACE: 'trace',
  AUDIT: 'audit'
}

const eventLog = async (messageProtocol, ...params) => {
  let service
  let isSpanClose = false
  let rootTraceId
  if (!grpcLogger) {
    grpcLogger = new DefaultEventLogger()
  }
  if (params) {
    service = params[0]
    if (params[1]) {
      if (typeof params[1] === 'boolean') {
        isSpanClose = params[1]
        if (params[2]) {
          rootTraceId = params[2]
        }
      } else {
        rootTraceId = params[1]
      }
    }
  }
  if (!messageProtocol.metadata.trace) {
    await grpcLogger.createSpanForMessageEnvelope(messageProtocol, service)
  } else if (isSpanClose) {
    await grpcLogger.logSpan(messageProtocol.metadata.trace)
  } else {
    if (!rootTraceId) {
      await grpcLogger.createChildSpanForMessageEnvelope(messageProtocol, messageProtocol.metadata.trace, service)
    } else {
      await grpcLogger.createSpanForMessageEnvelope(messageProtocol, service, rootTraceId)
    }
  }
}

const Logger = createLogger({
  level,
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    perf: 3,
    verbose: 4,
    debug: 5,
    silly: 6,
    trace: 7
  },
  format: combine(
    timestamp(),
    colorize(),
    customFormat
  ),
  transports: [
    new transports.Console()
  ],
  exceptionHandlers: [
    new transports.Console()
  ],
  exitOnError: false
})

let origInfoLog = Logger.info

Logger.info = async function (msg, ...params) {
  if (typeof msg === 'object') {
    await eventLog(msg, ...params)
  } else {
    origInfoLog.apply(Logger, arguments)
  }
}

let origDebugLog = Logger.debug

Logger.debug = async function (msg, ...params) {
  if (typeof msg === 'object') {
    await eventLog(msg, ...params)
  } else {
    origDebugLog.apply(Logger, arguments)
  }
}

let origLog = Logger.log

Logger.log = async function (level, msg, ...params) {
  switch (level) {
    case (customLevels.TRACE):
      await eventLog(msg, ...params)
      break
    case (customLevels.AUDIT):
      await eventLog(msg, ...params)
      break
    default:
      origLog.apply(Logger, arguments)
      break
  }
}

module.exports = {
  Logger,
  customLevels
}
