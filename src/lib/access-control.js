import jwt from 'jsonwebtoken'

import dBase from './db-client.js'
import config from '../../config/server.config.js'

// function parseToken (token) {
//   if (!token || typeof token !== 'string') {
//     throw new Error('Invalid token')
//   }

//   const parsedToken = jwt.decode(token)
//   return parsedToken
// }

async function verifyAndDecodeTokken (token) {
  return new Promise((resolve, reject) => {
    jwt.verify(token, config.JWT, (err, decoded) => {
      if (err) {
        if (err.name === 'TokenExpiredError') {
          reject(new Error('Session has expired'))
        } else {
          reject(err)
        }
      }
      resolve(decoded)
    })
  })
}

export class AuthControl {
  constructor (token) {
    this.db = dBase
    this.token = token
    this.permission = 0
  }

  async init () {
    try {
      if (this.token) {
        this.decodedToken = await verifyAndDecodeTokken(this.token)
        const now = Date.now()
        if (now > this.decodedToken.exp) {
          throw new Error('Session has expired')
        }
        if (!this.decodedToken.sid) {
          throw new Error('Invalid token')
        }
        this.session = await this.db.getSession(this.decodedToken.sid)
        if (!this.session) {
          throw new Error('Invalid token or session data')
        }
        const data = JSON.parse(this.session.data)
        this.permission = +(data.permission || 0)
      }
    } catch (err) {
      console.log(err)
    }
  }

  hasPermission (valueToCheck) {
    return this.permission >= valueToCheck
  }
}

export default AuthControl
