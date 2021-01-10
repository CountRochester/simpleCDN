// eslint-disable-next-line import/named
import { ServerError } from '../error.js'
import publicHandler from './public.js'
import uploadHandler from './upload.js'
import storageHandler from './file-storage.js'
import { FileBuffer } from '../lib/file-buffer.js'

const GOOD_LOG_COLOR = '\x1b[32m%s\x1b[0m'
const BAD_LOG_COLOR = '\x1b[31m%s\x1b[0m'

// const rootDir = path.resolve('')
// const staticPath = path.join(rootDir, config.STATIC_PATH)
// const uploadPath = path.join(rootDir, config.UPLOAD_PATH)

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

function defaultErrorHandler (err) {
  if (err) {
    console.log(BAD_LOG_COLOR, err)
  }
}

function verifyStatusCode (statusCode) {
  return typeof statusCode === 'number' ? statusCode : 200
}

async function defaultReqEndHandler ({
  req, res, data, handler, errHandler
}) {
  try {
    let { statusCode = 200, payload } = await handler(data)

    statusCode = verifyStatusCode(statusCode)

    payload = payload || ''
    writeHeader(res, 'text/plain', statusCode)

    logToServerConsole(req.method, statusCode, data.trimmedPath)

    res.end(payload)
  } catch (err) {
    console.log(BAD_LOG_COLOR, err)
    if (errHandler) {
      await errHandler()
    }
    writeHeader(res, 'text/plain', err.statusCode)
    res.end(err.message)
  }
}

const uploadFiles = (fileBuffer) => async (data) => {
  const filecontent = await fileBuffer.end(true)
  if (filecontent.length !== data.contentLength) {
    throw new Error('Content length does not match')
  }
  data.payload = filecontent
  const result = await uploadHandler(data)
  return result
}

export default {
  async notFound (req, res, data) {
    await defaultReqEndHandler({
      req,
      res,
      data,
      handler: () => {
        console.log('Accessed to:', data.trimmedPath)
        throw new ServerError(404, 'Not found')
      },
    })
  },
  'favicon.ico': async (req, res, data) => {
    data.trimmedPath = 'public/favicon.ico'
    await defaultReqEndHandler({
      req,
      res,
      data,
      handler: publicHandler,
    })
  },
  async public (req, res, data) {
    await defaultReqEndHandler({
      req,
      res,
      data,
      handler: publicHandler,
    })
  },
  async fileStorage (req, res, data) {
    await defaultReqEndHandler({
      req,
      res,
      data,
      handler: storageHandler,
    })
  },
  async upload (req, res, data) {
    const fileBuffer = new FileBuffer()

    req.on('data', (chunk) => {
      fileBuffer.write(chunk, defaultErrorHandler)
    })

    req.on('end', async () => {
      await defaultReqEndHandler({
        req,
        res,
        data,
        handler: uploadFiles(fileBuffer),
        errHandler: fileBuffer.destroy
      })
      console.log('End file transfere')
    })
  }
}
