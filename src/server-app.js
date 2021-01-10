import http from 'http'

import config from '../config/server.config.js'
import router from './router/index.js'

const { PORT, HOSTNAME } = config
const SYSTEM_LOG_COLOR = '\x1b[36m%s\x1b[0m'

function getTrimmedPath (parsedUrl) {
  return parsedUrl.pathname.replace(/^\/+|\/+$/g, '')
}

function choseHandler (trimmedPath) {
  if (trimmedPath.includes(`${config.STATIC_PATH}`)) {
    return router.public
  }
  if (trimmedPath.includes(`${config.STORAGE_ALIAS}`)) {
    return router.fileStorage
  }
  return router[trimmedPath]
    ? router[trimmedPath]
    : router.notFound
}

const serverHandler = (req, res) => {
  const parsedUrl = new URL(req.url, `http://${HOSTNAME}:${PORT}`)
  const trimmedPath = getTrimmedPath(parsedUrl)
  const method = req.method.toLowerCase()
  const contentLength = +req.headers['content-length']

  console.log(trimmedPath)

  const data = {
    trimmedPath,
    queryStringObject: parsedUrl.query,
    method,
    headers: req.headers,
    contentLength
  }

  const chosenHandler = choseHandler(trimmedPath)
  chosenHandler(req, res, data)
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
