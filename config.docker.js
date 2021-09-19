/* This config file is used to build the docker image */

const fs = require('fs')


function secret(name) {
  try {
    return fs.readFileSync('/run/secrets/' + name).toString()
  } catch (ex) {
    return process.env[name]
  }
}


module.exports = {
  server: {
    port: 80
  },
  bot: {
    token: secret('GREENLIGHT_DBOT_TOKEN'),
    clientid: secret('GREENLIGHT_DBOT_ID') || '792892789846704159',
    pubkey: secret('GREENLIGHT_DBOT_PUBKEY')
  },
  mongodb: {
    url: secret('GREENLIGHT_MONGO_URL'),
    dbname: 'greenlight'
  },
  admins: [
    '137258778092503042'
  ]
}
