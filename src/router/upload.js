/* eslint-disable import/no-unresolved */
import path from 'path'
import fs from 'fs/promises'

// eslint-disable-next-line import/named
import { ServerError } from '../error.js'
import config from '../../config/server.config.js'

const rootDir = path.resolve('')
const staticPath = path.join(rootDir, config.STATIC_PATH)

/*
  начало нового блока:
    ---------------------------- (28 -)
    549315553513576565954746 (число 24 цифры)
    \r\n (0D 0A)
  если ключ то:
    Content-Disposition: form-data; name="ИМЯ_КЛЮЧА"
    \r\n\r\n
    ЗНАЧЕНИЕ_КЛЮЧА
  если файл то:
    Content-Disposition: form-data; name="ИМЯ_КЛЮЧА"; filename="ИМЯ_ФАЙЛА"
    \r\n
    Content-Type: MIME_TYPE
    \r\n\r\n
    КОНТЕНТ
  кодировка:
*/

/*
  Content-Disposition: form-data; name="token"
    \r\n\r\n
    ЗНАЧЕНИЕ_КЛЮЧА
  Content-Disposition: form-data; name="destination"
    \r\n\r\n
    ЗНАЧЕНИЕ_КЛЮЧА
*/

const nameRegExp = /(?<= name=")([\s\S]+?)(?=")/gm
const filenameRegExp = /(?<= filename=")([\s\S]+?)(?=")/gm

function getChar (bufEl) {
  return String.fromCharCode(bufEl)
}

function getDividerFromBuffer (buffer) {
  let end = false
  const divider = []
  let i = 0
  while (!end) {
    divider.push(getChar(buffer[i]))
    if (getChar(buffer[i]) === '\r' && getChar(buffer[i + 1]) === '\n') {
      divider.push(getChar(buffer[i + 1]))
      end = true
    }
    i++
  }
  const output = Buffer.from(divider.join(''))
  return output
}

const writeFile = (file) => {
  if (!config.ALLOWED_MIME_TYPES.includes(file.contentType)) {
    throw new Error('Not allowed MIME type of file')
  }

  return fs.writeFile(
    path.join(staticPath, file.filename),
    file.value
  )
}

function getElementIndexes (buffer, divider) {
  const startIndexes = []
  let j = 0
  for (let i = 0; i < buffer.length; i++) {
    if (j === divider.length) {
      j = 0
      startIndexes.push(i)
    }
    if (buffer[i] === divider[j]) {
      j++
    } else {
      j = 0
    }
    if (i === divider.length && !startIndexes.length) {
      startIndexes.push(0)
    }
  }
  const output = startIndexes.map((el, index) => {
    const end = startIndexes[index + 1]
      ? startIndexes[index + 1] - divider.length - 3
      : buffer.length - divider.length - 5
    return {
      start: el,
      end
    }
  })
  return output
}

function splitBuffer (buffer, indexes) {
  const output = []
  indexes.forEach((el) => {
    const subBuf = buffer.slice(el.start, el.end + 1)
    output.push(subBuf)
  })
  return output
}

function formData (buffer) {
  const divider = getDividerFromBuffer(buffer)
  const indexes = getElementIndexes(buffer, divider)
  const data = splitBuffer(buffer, indexes)
  return data
}

function isValidData (dataElement) {
  const test = 'Content-Disposition: form-data;'
  const valueToTest = dataElement.slice(0, test.length)
  return valueToTest === test
}

function getMetaDataFromBuffer (bufferElement) {
  let end = false
  const metadata = []
  let i = 0
  while (!end && (i < bufferElement.length)) {
    metadata.push(getChar(bufferElement[i]))
    if (getChar(bufferElement[i]) === '\r'
      && getChar(bufferElement[i + 1]) === '\n'
      && getChar(bufferElement[i + 2]) === '\r'
      && getChar(bufferElement[i + 3]) === '\n') {
      metadata.push(getChar(bufferElement[i + 1]))
      metadata.push(getChar(bufferElement[i + 2]))
      metadata.push(getChar(bufferElement[i + 3]))
      end = true
    }
    i++
  }
  return {
    metadata: metadata.join(''),
    complete: end
  }
}

function parseMetadata (metadata) {
  if (!isValidData(metadata)) {
    throw new Error('Invalid data')
  }
  metadata.slice(0, -2)
  const preParse = metadata.split('\r\n')
  let filename
  let contentType
  const name = preParse[0].match(nameRegExp)[0]
  if (preParse[1]) {
    preParse[1] = preParse[1].replace('Content-Type: ', '')
    preParse[1].slice(0, -2)
    // eslint-disable-next-line prefer-destructuring
    filename = preParse[0].match(filenameRegExp)[0]
    // eslint-disable-next-line prefer-destructuring
    contentType = preParse[1]
  }
  return {
    name,
    filename,
    contentType
  }
}

function getParsedElement (metadata, elData) {
  const parsed = parseMetadata(metadata)
  const content = elData.slice(metadata.length)
  if (parsed.filename) {
    parsed.value = content
  } else {
    parsed.value = content.toString()
  }
  return parsed
}

function formElement (elData) {
  const { metadata } = getMetaDataFromBuffer(elData)
  return getParsedElement(metadata, elData)
}

function formElements (data) {
  const elements = []
  data.forEach((el) => {
    elements.push(formElement(el))
  })
  return elements
}

const handleBuffer = async (buffer) => {
  try {
    const data = formData(buffer)

    const elements = formElements(data)
    const files = elements.filter(el => el.filename)
    const keys = elements.filter(el => !el.filename)
    console.log(keys)
    files.forEach((file) => {
      console.log(file.contentType)
    })
    const writeFilePromises = files.map(writeFile)
    await Promise.all(writeFilePromises)
  } catch (err) {
    console.log(err)
    throw err
  }
}

export default async (data) => {
  try {
    if (data.method !== 'post') {
      throw new ServerError(405, 'Method Not Allowed')
    }
    if (!data.payload.length) {
      throw new ServerError(400, 'Bad Request')
    }
    await handleBuffer(data.payload)
  } catch (err) {
    ServerError.throw(err)
  }
  return {
    statusCode: 200,
    payload: 'Upload successfull'
  }
}
