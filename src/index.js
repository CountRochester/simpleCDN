import path from 'path'

import cdnServer from './server-app.js'
import config from '../config/server.config.js'
import helpers from './lib/helpers.js'

async function createNessaryFolders () {
  try {
    const rootPath = path.resolve('')
    const pathArr = []
    pathArr.push(path.join(rootPath, config.STATIC_PATH))
    pathArr.push(path.join(rootPath, config.UPLOAD_PATH))
    pathArr.push(path.join(rootPath, config.FILE_STORAGE_PATH))
    const promises = pathArr.map(helpers.createPathIfNeeded)
    await Promise.all(promises)
  } catch (err) {
    console.error(`Error creating base path: ${err.stack}`)
  }
}

createNessaryFolders().then(() => {
  cdnServer.start()
})
