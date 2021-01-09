/* eslint-disable consistent-return */
import path from 'path'
import fs from 'fs/promises'

import { ServerError } from '../error.js'
import config from '../../config/server.config.js'

const rootDir = path.resolve('')
const staticPath = path.join(rootDir, config.STATIC_PATH)

async function getStaticAsset (file) {
  const filePath = path.join(staticPath, file)
  const fileContent = await fs.readFile(filePath)
  return fileContent
}

export default async (data) => {
  try {
    if (data.method !== 'get') {
      throw new ServerError(405, 'Method Not Allowed')
    }
    const trimmedAssetName = data.trimmedPath.replace('public/', '')
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
