import { EventEmitter } from 'events'
import fs from 'fs'
import path from 'path'

import config from '../../config/server.config.js'
import helpers from './helpers.js'

const rootDir = path.resolve('')
// const staticPath = path.join(rootDir, config.STATIC_PATH)
const uploadPath = path.join(rootDir, config.UPLOAD_PATH)

export class FileBuffer extends EventEmitter {
  constructor () {
    super()
    this.emit('beforeCreate')
    const fileName = `${helpers.createRandomString(12)}.tmp`
    this.filePath = path.join(uploadPath, fileName)
    this.writeStream = fs.createWriteStream(this.filePath, { encoding: 'hex' })
    this.emit('created')
  }

  write (data, callback) {
    this.emit('beforeWrite')
    this.writeStream.write(data, () => {
      this.emit('afterWrite')
      callback()
    })
  }

  async end (removeTempFile) {
    this.emit('beforeEnd')
    this.writeStream.end()
    this.emit('end')
    const filecontent = await this.getFileContent()
    if (removeTempFile) {
      await this.removeTempFile()
    }
    this.emit('afterEnd')
    return filecontent
  }

  async removeTempFile () {
    this.emit('beforeDeleteTempFile')
    await fs.promises.unlink(this.filePath)
    this.emit('afterDeleteTempFile')
  }

  async getFileContent () {
    const filecontent = await fs.promises.readFile(this.filePath)
    this.emit('readFileContent', filecontent)
    return filecontent
  }

  async destroy () {
    this.emit('beforeDestroy')
    this.writeStream.end()
    try {
      await this.removeTempFile()
    } catch (err) {
      console.log('There is no temp file')
    }
    this.emit('afterDestroy')
  }
}

export default FileBuffer
