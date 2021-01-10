import devConfig from './dev.config.js'

const isDevelopment = process.env.NODE_ENV.trim() === 'development'

const {
  HOSTNAME,
  PORT,
  DB_HOST,
  DB_PORT,
  DB_USER_AUTH,
  DB_PSWD_AUTH,
  DB_AUTH,
  JWT
} = process.env

const base = isDevelopment
  ? devConfig
  : {
    HOSTNAME,
    PORT,
    DB_HOST,
    DB_PORT,
    DB_USER_AUTH,
    DB_PSWD_AUTH,
    DB_AUTH,
    JWT
  }
const config = {
  ...base,
  STATIC_PATH: 'public',
  UPLOAD_PATH: 'upload',
  ALLOWED_MIME_TYPES: [
    'application/pdf',
    'application/zip',
    'image/jpeg',
    'image/png',
    'image/tiff',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/zip',
    'application/octet-stream',
    'application/x-zip-compressed',
    'multipart/x-zip',
    'application/x-rar-compressed',
    'text/plain'
  ]
}
export default config
