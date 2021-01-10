/* eslint-disable import/no-unresolved */
import path from 'path'
import fs from 'fs'

// eslint-disable-next-line import/named
import { ServerError } from '../error.js'
import config from '../../config/server.config.js'
import extract from '../lib/extract-formdata.js'
import helpers from '../lib/helpers.js'

const rootDir = path.resolve('')
const uploadPath = path.join(rootDir, config.UPLOAD_PATH)

/*
  keys: {
    name: String,
    value: String
  }

  files: {
    name: String,
    filename: String,
    contentType: String,
    value: Buffer
  }
*/

const writeFile = async (file) => {
  if (!config.ALLOWED_MIME_TYPES.includes(file.contentType)) {
    throw new Error('Not allowed MIME type of file')
  }
  await helpers.createFilePathIfNeeded(file.destinationPath)
  await fs.promises.writeFile(file.destinationPath, file.value)
}

const findEqualName = name => el => el.name === name

function formFiles (keys, files) {
  const output = []
  files.forEach((file) => {
    const matchKey = keys.find(findEqualName(file.name))
    const destPath = !matchKey || !matchKey.value || !matchKey.value.length
      ? path.join(uploadPath, file.filename)
      : path.join(rootDir, config.FILE_STORAGE_PATH, matchKey.value, file.filename)
    output.push({ ...file, destinationPath: destPath })
  })
  return output
}

async function handleBuffer (buffer) {
  try {
    const { keys, files } = extract(buffer)
    const filesArr = formFiles(keys, files)
    const writeFilePromises = filesArr.map(writeFile)
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
