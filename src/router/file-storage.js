/* eslint-disable consistent-return */
import path from 'path'
import fs from 'fs'

import { ServerError } from '../error.js'
import config from '../../config/server.config.js'

const rootDir = path.resolve('')
const storagePath = path.join(rootDir, config.FILE_STORAGE_PATH)

async function getStaticAsset (file) {
  const filePath = path.join(storagePath, file)
  const fileContent = await fs.promises.readFile(filePath)
  return fileContent
}

export default async (data) => {
  try {
    if (data.method !== 'get') {
      throw new ServerError(405, 'Method Not Allowed')
    }
    const trimmedAssetName = data.trimmedPath
      .replace(`${config.STORAGE_ALIAS}/`, '')
    if (!trimmedAssetName.length) {
      throw new ServerError(404, 'Not Found')
    }
    const asset = await getStaticAsset(trimmedAssetName)
    return {
      statusCode: 200,
      payload: asset
    }
  } catch (err) {
    ServerError.throw(err)
  }
}
