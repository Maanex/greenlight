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
        description: 'ADMIN ONLY - Change a users tokens',
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
        description: 'ADMIN ONLY - test',
        type: 1,
        options: [
          {
            name: 'args',
            description: 'args',
            type: 3,
            required: false
          }
        ]
      },
      {
        name: 'addgoal',
        description: 'ADMIN ONLY - Add a new goal',
        type: 1,
        options: [
          {
            name: 'title',
            description: 'What\'s the goal\'s name?',
            type: 3,
            required: true
          },
          {
            name: 'description',
            description: 'Give it a description!',
            type: 3,
            required: true
          },
          {
            name: 'cost',
            description: 'How many tokens are required?',
            type: 4,
            required: true
          },
          {
            name: 'channel',
            description: 'Which channel shall be used to host this goal?',
            type: 7,
            required: true
          }
        ]
      },
      {
        name: 'removegoal',
        description: 'ADMIN ONLY - Remove a goal',
        type: 1,
        options: [
          {
            name: 'messageid',
            description: 'Messageid of the goal',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'goalinfo',
        description: 'ADMIN ONLY - View some info about a goal',
        type: 1,
        options: [
          {
            name: 'messageid',
            description: 'Messageid of the goal',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'editgoal',
        description: 'ADMIN ONLY - Edit a goal',
        type: 1,
        options: [
          {
            name: 'messageid',
            description: 'Messageid of the goal',
            type: 3,
            required: true
          },
          {
            name: 'property',
            description: 'Which property to edit',
            type: 3,
            required: true,
            choices: [
              { name: 'Title', value: 'title' },
              { name: 'Description', value: 'description' },
              { name: 'Cost', value: 'cost' }
            ]
          },
          {
            name: 'new_value',
            description: 'The propertie\'s new value',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'users',
        description: 'ADMIN ONLY - Users info',
        type: 1,
        options: [
          {
            name: 'target',
            description: '"top", "total", goal message id or user id',
            type: 3,
            required: true
          }
        ]
      },
      {
        name: 'finishgoal',
        description: 'ADMIN ONLY - Finishes a goal. Or unfinishes it if it is already finished. Finnish.',
        type: 1,
        options: [
          {
            name: 'messageid',
            description: 'Messageid of the goal',
            type: 3,
            required: true
          }
        ]
      }
    ]
  }, opts)
}
run()
