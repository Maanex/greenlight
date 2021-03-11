import { DMChannel, TextChannel } from 'discord.js'
import { Router, Request, Response } from 'express'
import { Core } from '../../../index'
import DatabaseManager from '../../../core/database-manager'


export const router = Router()

router.post(
  '/topgg',
  async (req: Request, res: Response) => {
    const auth = req.headers ? (req.headers.authorization || req.headers['proxy-authorization']) : undefined
    if (!auth) return res.status(401).send('401 Unauthorized')

    const botid = req.body?.bot || undefined
    for (const project of await DatabaseManager.getProjects()) {
      console.log('1')
      const conf = project.integrations?.topgg?.bots?.find(b => b.id === botid)
      if (!conf) continue
      console.log('2')

      if (auth !== conf.auth) continue

      console.log('3')

      const delta = (conf.reward_weekend !== undefined && req.body.isWeekend)
        ? conf.reward_weekend
        : conf.reward

      if (req.body.type === 'test') {
        console.log('TEST RUN')
        continue
      }

      const guild = await Core.guilds.fetch(project.discord_guild_id)
      if (!guild.members.resolve(req.body.user)) continue

      console.log('4')

      const error = await DatabaseManager.modTokens(req.body.user, project._id, delta, {
        type: 'acquire',
        delta,
        timestamp: Date.now() / 1000,
        target: 'topgg'
      })

      console.log('5')
      console.log(error)

      if (!error && project.integrations.topgg.announce) {
        const settings = project.integrations.topgg.announce
        try {
          const loc = settings.location === 'dm'
            ? <DMChannel> await (await Core.users.fetch(req.body.user)).createDM()
            : <TextChannel> (await Core.guilds.fetch(settings.location.split('/')[0])).channels.resolve(settings.location.split('/')[1])
          if (!loc) continue

          const text = (conf.reward_weekend !== undefined && req.body.isWeekend && settings.text_weekend)
            ? settings.text_weekend
            : settings.text
          loc.send(text.split('{user}').join(`<@${req.body.user}>`))
        } catch (err) {
          console.log('e2')
          console.log(err)
        }
      }
      console.log('6')
    }

    res.status(200).send('Thank you')
  }
)
