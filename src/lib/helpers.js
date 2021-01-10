import fs from 'fs'
import path from 'path'

const helpers = {
  createRandomString (length) {
    const strLength = typeof length === 'number' && length > 0
      ? length
      : false
    if (!strLength) { return '' }

    // eslint-disable-next-line max-len
    const possibleCaracters = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ1234567890-_'
    let i = 0
    let outputString = ''
    while (i++ < strLength) {
      const indexOfChar = Math.floor(Math.random() * possibleCaracters.length)
      outputString += possibleCaracters[indexOfChar]
    }
    return outputString
  },

  async createPathIfNeeded (dir) {
    try {
      const dirFD = await fs.promises.opendir(dir)
      await dirFD.close()
    } catch (err) {
      if (err.code === 'ENOENT') {
        await fs.promises.mkdir(dir)
      } else {
        throw err
      }
    }
  },

  async createFilePathIfNeeded (filePath) {
    const { dir } = path.parse(filePath)
    await helpers.createPathIfNeeded(dir)
  }
}

export default helpers
