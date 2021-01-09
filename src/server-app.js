import http from 'http'

import config from '../config/server.config.js'
import router from './router/index.js'

const { PORT, HOSTNAME } = config
const SYSTEM_LOG_COLOR = '\x1b[36m%s\x1b[0m'
const GOOD_LOG_COLOR = '\x1b[32m%s\x1b[0m'
const BAD_LOG_COLOR = '\x1b[31m%s\x1b[0m'

function verifyStatusCode (statusCode) {
  return typeof statusCode === 'number' ? statusCode : 200
}

function getTrimmedPath (parsedUrl) {
  return parsedUrl.pathname.replace(/^\/+|\/+$/g, '')
}

function choseHandler (trimmedPath) {
  if (trimmedPath.includes('public')) {
    return router.public
  }
  return router[trimmedPath]
    ? router[trimmedPath]
    : router.notFound
}

function writeHeader (res, contentType, statusCode) {
  res.setHeader('Content-Type', contentType)
  res.writeHead(statusCode)
}

function logToServerConsole (method, statusCode, trimmedPath) {
  if (statusCode === 200) {
    console.log(GOOD_LOG_COLOR, `${method} /${trimmedPath} ${statusCode}`)
  } else {
    console.log(BAD_LOG_COLOR, `${method} /${trimmedPath} ${statusCode}`)
  }
}

const serverHandler = (req, res) => {
  const buffer = []
  req.on('data', (data) => {
    buffer.push(data)
  })
  req.on('end', async () => {
    const parsedUrl = new URL(req.url, `http://${HOSTNAME}:${PORT}`)
    const trimmedPath = getTrimmedPath(parsedUrl)
    const chosenHandler = choseHandler(trimmedPath)
    const data = {
      trimmedPath,
      queryStringObject: parsedUrl.query,
      method: req.method.toLowerCase(),
      headers: req.headers,
      payload: buffer
    }
    try {
      let { statusCode = 200, payload } = await chosenHandler(data, req)
      statusCode = verifyStatusCode(statusCode)

      payload = payload || ''
      writeHeader(res, 'text/plain', statusCode)

      logToServerConsole(req.method, statusCode, trimmedPath)

      res.end(payload)
    } catch (err) {
      console.log(BAD_LOG_COLOR, err)
      writeHeader(res, 'text/plain', err.statusCode)
      res.end(err.message)
    }
  })
}

const serverListener = (server) => () => {
  const type = process.env.NODE_ENV
  console.log(SYSTEM_LOG_COLOR, `Запуск сервера в режиме ${type}`)
  console.log(SYSTEM_LOG_COLOR,
    `CDN-сервер запущен на ${server.hostname}:${server.port}`)
}

class CDNServer {
  constructor (hostname = '', port = 4000) {
    this.server = http.createServer(serverHandler)
    this.port = port
    this.hostname = hostname
  }

  start () {
    this.server.listen(this.port, this.hostname, serverListener(this))
  }
}

const cdnServer = new CDNServer(HOSTNAME, PORT)

export default cdnServer
