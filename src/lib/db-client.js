import pg from 'pg'

import config from '../../config/server.config.js'

const {
  DB_HOST, DB_PORT, DB_USER_AUTH, DB_PSWD_AUTH, DB_AUTH
} = config

const dbConfig = {
  user: DB_USER_AUTH,
  host: DB_HOST,
  database: DB_AUTH,
  password: DB_PSWD_AUTH,
  port: DB_PORT,
}

const findSessionQuery = 'SELECT * FROM "Sessions" WHERE "sid"='

class DBClient {
  constructor () {
    this.client = new pg.Client(dbConfig)
  }

  async initNewClient () {
    if (!this.client) {
      this.client = new pg.Client(dbConfig)
    }
    await this.client.connect()
  }

  async getSession (sid) {
    await this.initNewClient()
    const query = `${findSessionQuery}'${sid}'`
    const result = await this.client.query(query)
    await this.close()
    return result.rows[0]
  }

  async close () {
    await this.client.end()
    this.client = null
  }
}

const dBase = new DBClient()

export default dBase
