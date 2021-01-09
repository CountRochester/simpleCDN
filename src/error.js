export class ServerError extends Error {
  static #errorCodes = {
    EACCES: () => { throw new ServerError(503, 'File not accessable.') },
    EADDRINUSE: () => { throw new ServerError(500, 'Address already in use.') },
    ECONNREFUSED: () => { throw new ServerError(403, 'Connection refused.') },
    ECONNRESET: () => { throw new ServerError(499, 'Connection reset by peer.') },
    EEXIST: () => { throw new ServerError(404, 'File not found.') },
    EISDIR: () => { throw new ServerError(400, 'An operation expected a file, but the given pathname was a directory.') },
    EMFILE: () => { throw new ServerError(500, 'Too many open files in system.') },
    ENOENT: () => { throw new ServerError(404, 'No such file or directory.') },
    ENOTDIR: () => { throw new ServerError(400, 'A component of the given pathname existed, but was not a directory as expected.') },
    ENOTEMPTY: () => { throw new ServerError(400, 'Directory not empty.') },
    ENOTFOUND: () => { throw new ServerError(500, 'DNS lookup failed.') },
    EPERM: () => { throw new ServerError(403, 'Operation not permitted.') },
    EPIPE: () => { throw new ServerError(500, 'A write on a pipe, socket, or FIFO for which there is no process to read the data.') },
    ETIMEDOUT: () => { throw new ServerError(408, 'Operation timed out.') },
    default: (err) => { throw new ServerError(520, `Unknown server error: ${err.message}`) }
  }

  constructor(code, message, type) {
    super(message)
    this.statusCode = code
    if (type === 'json') {
      this.payload = { error: message }
    }
  }

  static throw (err) {
    if (err && this.#errorCodes[err.code]) {
      this.#errorCodes[err.code]()
    } else {
      this.#errorCodes.default(err)
    }
  }
}
