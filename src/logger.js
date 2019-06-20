'use strict'

const { createLogger, format, transports } = require('winston')
const { combine, timestamp, colorize, printf } = format
const level = process.env.LOG_LEVEL || 'info'
const DefaultEventLogger = require('@mojaloop/event-sdk').DefaultEventLogger

const customFormat = printf(({ level, message, timestamp }) => {
  return `${timestamp} - ${level}: ${message}`
})

let grpcLogger

const customLevels = {
  TRACE: 'trace',
  AUDIT: 'audit'
}

const eventLog = async (message) => {
  if (!grpcLogger) {
    grpcLogger = new DefaultEventLogger()
  }
  return grpcLogger.log(message)
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

Logger.info = async function (msg) {
  if (typeof msg === 'object') {
    await eventLog(msg)
  } else {
    origInfoLog.apply(Logger, arguments)
  }
}

let origDebugLog = Logger.debug

Logger.debug = async function (msg) {
  if (typeof msg === 'object') {
    await eventLog(msg)
  } else {
    origDebugLog.apply(Logger, arguments)
  }
}

let origLog = Logger.log

Logger.log = async function (level, msg) {
  switch (level) {
    case (customLevels.TRACE):
      await eventLog(msg)
      break
    case (customLevels.AUDIT):
      await eventLog(msg)
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
