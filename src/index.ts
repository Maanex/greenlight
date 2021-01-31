/* eslint-disable import/first,import/order */

export const config = require('../config.js')

import { Client, ClientOptions } from 'discord.js'
import * as chalk from 'chalk'
import MongoAdapter from './database/mongo-adapter'
import Database from './database/database'
import { logVersionDetails } from './util/git-parser'
import ParseArgs from './util/parse-args'
import InteractionReceiver from './core/interactions-receiver'
import DatabaseManager from './core/database-manager'
import Server from './server/server'
import ReactionsListener from './core/events/reactions'
import GoalHandler from './core/goal-handler'

const isDocker = require('is-docker')


export class GreenlightBot extends Client {

  public readonly devMode: boolean;
  public readonly singleShard: boolean;

  constructor(options: ClientOptions, params: any) {
    super(options)

    this.devMode = process.env.NODE_ENV === 'dev'
    this.singleShard = !!params.noSharding

    if (isDocker())
      console.log(chalk.white.bold('Running containerized'))
    if (this.devMode) {
      console.log(chalk.bgRedBright.black(' RUNNING DEV MODE '))
      console.log(chalk.yellowBright('Skipping Sentry initialization ...'))
    } else {
      console.log(chalk.yellowBright('Initializing Sentry ...'))
      console.log('SKIPPED - TODO')
      console.log(chalk.green('Sentry initialized'))
    }

    logVersionDetails()

    MongoAdapter.connect(config.mongodb.url)
      .catch((err) => {
        console.error(err)
      })
      .then(async () => {
        console.log('Connected to Mongo')

        await Database.init()

        InteractionReceiver.init(this)
        DatabaseManager.init(this)
        ReactionsListener.init(this)
        GoalHandler.init(this)

        Server.start(5008)

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

const params = {
  noSharding: process.env.NO_SHARDING,
  shardCount: process.env.SHARD_COUNT,
  shardId: process.env.SHARD_ID
}
const args = ParseArgs.parse(process.argv)
for (const name in args)
  params[name] = args[name]

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
        'GUILDS',
        'GUILD_MESSAGE_REACTIONS'
      ]
    },
    disableMentions: 'none',
    // messageSweepInterval: 2,
    // messageCacheLifetime: 2,
    // messageCacheMaxSize: 2,
    shardCount: sharding ? shardCount : 1,
    shards: [ (sharding ? shardId : 0) ]
  },
  params
)
