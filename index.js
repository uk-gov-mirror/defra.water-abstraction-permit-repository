//provides permit API
require('dotenv').config()

const Hapi = require('hapi')


const serverOptions = {connections: {router: {stripTrailingSlash: true}}}
const server = new Hapi.Server(serverOptions)


server.connection({ port: process.env.PORT || 8000 })

if (process.env.DATABASE_URL) {
  // get heroku db params from env vars

  var workingVariable = process.env.DATABASE_URL.replace('postgres://', '')
  process.env.PGUSER = workingVariable.split('@')[0].split(':')[0]
  process.env.PGPASSWORD = workingVariable.split('@')[0].split(':')[1]
  process.env.PGHOST = workingVariable.split('@')[1].split(':')[0]
  process.env.PSPORT = workingVariable.split('@')[1].split(':')[1].split('/')[0]
  process.env.PGDATABASE = workingVariable.split('@')[1].split(':')[1].split('/')[1]
}

const cacheKey = process.env.cacheKey || 'super-secret-cookie-encryption-key'
const sessionPluginOptions = {
  cache: { segment: 'unique-cache-sement' },
  cookie: { isSecure: false },
  key: 'bla-bla-bla'
}

// isSecure = true for live...
var yar_options = {
  storeBlank: false,
  cookieOptions: {
    password: 'the-password-must-be-at-least-32-characters-long',
    isSecure: false
  }
}

server.register(  {
  register: require('yar'),
  options: yar_options
}, function (err) { })



server.register([ {
      register: require('node-hapi-airbrake'),
      options: {
        key: process.env.errbit_key,
        host: process.env.errbit_server
      }
  },{
    // Plugin to display the routes table to console at startup
    // See https://www.npmjs.com/package/blipp
    register: require('blipp'),
    options: {
      showAuth: true
    }
  },require('hapi-auth-jwt2'), require('inert'), require('vision')], (err) => {
  if (err) {
    throw err
  }





  function validateJWT(decoded, request, callback){
    // bring your own validation function
    console.log(request.url.path)
    console.log(request.payload)
      console.log('CALL WITH TOKEN')
      console.log(decoded)
        // TODO: JWT tokens to DB...
        // do your checks to see if the person is valid
      if (!decoded.id) {
        console.log('boo... JWT failed')
        return callback(null, false)
      } else {
        console.log('huzah... JWT OK')
        return callback(null, true)
      }
    }




  server.auth.strategy('jwt', 'jwt',
    { key: process.env.JWT_SECRET,          // Never Share your secret key
      validateFunc: validateJWT,            // validate function defined above
      verifyOptions: {}, // pick a strong algorithm
      verifyFunc: validateJWT,
    })

  server.auth.default('jwt')


  // load routes
  server.route(require('./src/routes/API'))



})

// Start the server if not testing with Lab
if (!module.parent) {
  server.start((err) => {
    if (err) {
      throw err;
    }
    console.log(`Server running at: ${server.info.uri}`);
  });
}

module.exports = server
