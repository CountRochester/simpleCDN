import { ServerError } from '../error.js'
import publicHandler from './public.js'
import uploadHandler from './upload.js'

export default {
  notFound () {
    throw new ServerError(404, 'Not found')
  },
  public: publicHandler,
  upload: uploadHandler
}
