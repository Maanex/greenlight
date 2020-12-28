/* eslint-disable import/first,import/order */

export const config = require('../config.js')

import { Client, ClientOptions, User } from 'discord.js'
import * as chalk from 'chalk'
import MongoAdapter from './database/mongo-adapter'
import Database from './database/database'
import { logVersionDetails } from './util/git-parser'
import ParseArgs from './util/parse-args'
import InteractionReceiver from './core/interactions-receiver'
import DatabaseManager from './core/database-manager'


export class GreenlightBot extends Client {

  public readonly devMode: boolean;
  public readonly singleShard: boolean;

  constructor(options: ClientOptions, params: any) {
    super(options)

    this.devMode = process.env.NODE_ENV === 'dev'
    this.singleShard = !!params.noSharding

    if (this.devMode) {
      console.log(chalk.bgRedBright.black(' RUNNING DEV MODE '))
      console.log(chalk.yellowBright('Skipping Sentry initialization ...'))
    } else {
      console.log(chalk.yellowBright('Initializing Sentry ...'))
      console.log('SKIPPED - TODO')
      console.log(chalk.green('Sentry initialized'))
    }

    logVersionDetails()
    fixReactionEvent(this)

    MongoAdapter.connect(config.mongodb.url)
      .catch((err) => {
        console.error(err)
      })
      .then(async () => {
        console.log('Connected to Mongo')

        await Database.init()

        InteractionReceiver.init(this)
        DatabaseManager.init(this)

        // TODO find an actual fix for this instead of this garbage lol
        const manualConnectTimer = setTimeout(() => {
          // @ts-ignore
          this.ws?.connection?.triggerReady()
        }, 30000)

        this.on('ready', () => {
          console.log(chalk`Bot ready! Logged in as {yellowBright ${this.user?.tag}} {gray (${params.noSharding ? 'No Sharding' : `Shard ${(options.shards as number[]).join(', ')} / ${options.shardCount}`})}`)
          if (this.devMode) console.log(this.guilds.cache.map(g => `${g.name} :: ${g.id}`))

          const updateActivity = u => u?.setActivity('👀', { type: 'WATCHING' })
          setInterval(updateActivity, 1000 * 60 * 15, this.user)
          updateActivity(this.user)

          clearTimeout(manualConnectTimer)
        })

        this.login(config.bot.token)
      })
  }

  // public text(d: GuildData, text: string, replace?: { [varname: string]: string }): string {
  //   let out = (text.startsWith('=')
  //     ? this.languageManager.getRaw(d.language, text.substr(1), true)
  //     : text);
  //   if (replace) {
  //     for (const key in replace)
  //       out = out.split(`{${key}}`).join(replace[key]);
  //   }
  //   return out;
  // }

}

const params = ParseArgs.parse(process.argv)

const sharding = !params.noSharding
if (sharding && (!params.shardCount || !params.shardId)) {
  console.error(chalk.red`Missing --shardCount or --shardId`)
  process.exit(-1)
}
const shardCount = parseInt(params.shardCount as string, 10)
const shardId = parseInt(params.shardId as string, 10)
if (sharding && (!params.shardCount || !params.shardId)) {
  console.error(chalk.red`Invalid --shardCount or --shardId`)
  process.exit(-1)
}

export const Core = new GreenlightBot(
  {
    ws: {
      intents: [
        'GUILDS'
      ]
    },
    disableMentions: 'none',
    messageSweepInterval: 2,
    messageCacheLifetime: 2,
    messageCacheMaxSize: 2,
    shardCount: sharding ? shardCount : 1,
    shards: [ (sharding ? shardId : 0) ]
  },
  params
)


function fixReactionEvent(bot: GreenlightBot) {
  const events = {
    MESSAGE_REACTION_ADD: 'messageReactionAdd',
    MESSAGE_REACTION_REMOVE: 'messageReactionRemove'
  }

  bot.on('raw', async (event: Event) => {
    const ev: any = event
    if (!events.hasOwnProperty(ev.t)) return // eslint-disable-line
    const data = ev.d
    const user: User = bot.users.cache.get(data.user_id)
    const channel: any = bot.channels.cache.get(data.channel_id) || await user.createDM()
    if (channel.messages.has(data.message_id)) return
    const message = await channel.fetchMessage(data.message_id)
    const emojiKey = (data.emoji.id) ? `${data.emoji.name}:${data.emoji.id}` : data.emoji.name
    const reaction = message.reactions.get(emojiKey)
    bot.emit(events[ev.t], reaction, user)
  })
}
