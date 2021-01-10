import http from 'http'
import path from 'path'
import fs from 'fs'

import config from '../config/server.config.js'
import router from './router/index.js'

const { PORT, HOSTNAME } = config
const SYSTEM_LOG_COLOR = '\x1b[36m%s\x1b[0m'
const GOOD_LOG_COLOR = '\x1b[32m%s\x1b[0m'
const BAD_LOG_COLOR = '\x1b[31m%s\x1b[0m'

const rootDir = path.resolve('')
const staticPath = path.join(rootDir, config.STATIC_PATH)
const uploadPath = path.join(rootDir, config.UPLOAD_PATH)

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
  const parsedUrl = new URL(req.url, `http://${HOSTNAME}:${PORT}`)
  const trimmedPath = getTrimmedPath(parsedUrl)
  const method = req.method.toLowerCase()
  const boundary = req.headers['content-type']
    .replace('multipart/form-data; boundary=', '')
  const contentLength = +req.headers['content-length']

  console.log('boundary:', boundary)
  console.log('contentLength:', contentLength)

  const filePath = path.join(uploadPath, 'test.tmp')
  const writeStream = fs.createWriteStream(filePath, { encoding: 'hex' })

  const buffer = []
  req.on('data', (data) => {
    writeStream.write(data, (err) => {
      if (err) {
        console.log(BAD_LOG_COLOR, err)
      }
    })
  })
  // eslint-disable-next-line max-statements
  req.on('end', async () => {
    try {
      writeStream.end()

      const filecontent = await fs.promises.readFile(filePath)
      if (filecontent.length !== contentLength) {
        throw new Error('Content length does not match')
      }

      const chosenHandler = choseHandler(trimmedPath)
      const data = {
        trimmedPath,
        queryStringObject: parsedUrl.query,
        method,
        headers: req.headers,
        payload: filecontent
      }
      let { statusCode = 200, payload } = await chosenHandler(data)
      statusCode = verifyStatusCode(statusCode)
      await fs.promises.unlink(filePath)

      payload = payload || ''
      writeHeader(res, 'text/plain', statusCode)

      logToServerConsole(req.method, statusCode, trimmedPath)

      res.end(payload)
    } catch (err) {
      console.log(BAD_LOG_COLOR, err)
      writeHeader(res, 'text/plain', err.statusCode)
      res.end(err.message)
    }
    console.log(`Processed ${buffer.length} chunks`)
    buffer.length = 0
    console.log('End transmission')
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
