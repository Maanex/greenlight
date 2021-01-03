const axios = require('axios')
const config = require('../config.js')

if (!config) throw new Error('Config not found. Please cd into /scripts')

const token = config.bot.token
const clientid = config.bot.clientid

async function run() {
  const opts = {
    headers: { Authorization: `Bot ${token}` }
  }

  const { data } = await axios.get(`https://discord.com/api/v8/applications/${clientid}/commands`, opts)

  await Promise.all(data.map(d => axios.delete(`https://discord.com/api/v8/applications/${clientid}/commands/${d.id}`, opts)))

  axios.post(`https://discord.com/api/v8/applications/${clientid}/commands`, {
    name: 'tokens',
    description: 'See how many greenlight tokens you have'
  }, opts)

  axios.post(`https://discord.com/api/v8/applications/${clientid}/commands`, {
    name: 'admin',
    description: 'YOU CANNOT USE THIS',
    options: [
      {
        name: 'tokens',
        description: 'Change a users tokens',
        type: 1,
        options: [
          {
            name: 'user',
            description: 'Who?',
            type: 6,
            required: true
          },
          {
            name: 'amount',
            description: 'How much?',
            type: 4,
            required: true
          },
          {
            name: 'reason',
            description: 'Why?',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'test',
        description: 'test',
        type: 1,
        options: [
          {
            name: 'args',
            description: 'args',
            type: 3,
            required: false
          }
        ]
      }
    ]
  }, opts)
}
run()
