# Simple file server
Simple CDN server for Freeware ECM-system https://github.com/CountRochester/Oort

## Features
- Upload and provide access to uploaded files
- Multiple file upload support via Multipart/form-data
- MIME-type filter
- Session based access control with different permissions
- Only two dependences
### Requirements
- Node.JS v.14 and above
- PostgreSQL based database for accessing to user's sessions
- You need to setup some environment variables (see below)
### Environment variables
- HOSTNAME - hostname of the server
- PORT - port of the server
- DB_HOST - hostname of the database
- DB_PORT - port of the database
- DB_AUTH - name of the database containing user's sessions
- DB_USER_AUTH - username for access to database
- DB_PSWD_AUTH - password for access to database
- JWT - jsonwebtoken key
### Base config in config/server.config.js
- STATIC_PATH - path for public (available to access without login) files. Path is specified from root of the server dir.
- UPLOAD_PATH - path for upload dir. Path is specified from root of the server dir
- FILE_STORAGE_PATH - path for file storage. Access control system will provide access to this folder only for logged users. Path is specified from root of the server dir.
- STORAGE_ALIAS - path in browser to access file storage. I.e. for alias *storage* path in browser wil be `http://localhost:3000/storage/ `
- ALLOWED_MIME_TYPES - array of allowed MIME-types
### Database requirements
- Database should contain table `Sessions`:
```sh
  Sessions: {
    sid: String,
    expires: timestampz,
    employeeId: Number,
    data: String,
    UserId: Number
  }
```
- data should contain JSON stringified object with key `permission` and value in Number-type.

## API
### Routes

There only three posible routes (below specified only defauls values of routes which can be changed in server.config.js file):
- /public/ *filepath/filename*
  
  Alowed method GET. No token or session needed to access this route. Returns the file by filepath/filename or an error 404 if not found.
- /storage/ *filepath/filename*
  
  Alowed method GET. Valid token required in headers.token and active session needed to access this route. Returns the file by filepath/filename or an error 404 if not found.
- /upload/
  
  Alowed method POST. Valid token required in headers.token and active session needed to access this route only if the file is uploading in file-storage. Returns *Upload successfull* or an error if occurs.

### Format of Multipart/form-data
Content of Multipart/form-data may contain multiple pairs of key and values. Values may be type of file. In that case key should contain unique value to identify the file. If value is type of string than it is meaning that it is the destination of the file:

|key| value| type
:---|:----:|:---
file1| storage/user| string
file1| admin.pdf| file
file2| guest.pdf| file

```sh
curl --location --request POST 'http://localhost:4000/upload' \
--header 'token: thisIsTheTestToken' \
--form 'file1="storage/user"' \
--form 'file1=@"/C:/test/admin.pdf"' \
--form 'file2=@"/C:/test/guest.pdf"' \
```
The result is:
- if the token is valid and session is not expired then *admin.pdf* will be copied to `<rootServer>/file-storage/user`
- file *guest.pdf* will be copied to `<rootServer>/upload` in any case
