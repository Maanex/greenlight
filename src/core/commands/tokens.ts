import * as moment from 'moment'
import notSetup from '../helper/not-setup-cmdh'
import DatabaseManager from '../database-manager'
import { Interaction, InteractionResponseFlags, CommandHandler, ReplyFunction, Transaction, Project } from '../../types'
import { Core } from '../../index'


export default class TokensHandler extends CommandHandler {

  public async handle(command: Interaction, reply: ReplyFunction) {
    if (await notSetup(command, reply)) return

    const project = await DatabaseManager.getProjectByGuild(command.guild_id)
    const user = await DatabaseManager.getUser(command.member.user.id, project._id)

    let text = ''
    if (user) {
      const trans = await Promise.all(user
        .transactions
        .reverse()
        .splice(0, 5)
        .map(async t => await TokensHandler.transactionToText(t, project))
      )
      text = `**You have ${user.tokens} ${project.display.token_icon_one}**\n\nRecent transactions:\n\`\`\`diff\n${trans.join('\n')}\`\`\``
    } else {
      text = `**You have 0 ${project.display.token_icon_one}**\n\n${project.texts.get_tokens}`
    }

    reply('ChannelMessage', {
      content: text,
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }

  private static async transactionToText(t: Transaction, project: Project): Promise<string> {
    const delta = t.delta < 0 ? t.delta : ('+' + t.delta)
    const time = `(${moment(t.timestamp * 1000).fromNow()})`
    switch (t.type) {
      case 'purchase': return `${delta} by purchasing ${t.target} ${time}`
      case 'pledge': return `${delta} by contributing to goal "${project.goals.find(g => g._id === t.target).title}" ${time}`
      case 'admin': return `${delta} by ${(await Core.users.fetch(t.issuer)).username} for reason: ${t.reason} ${time}`
      case 'custom': return `${delta} custom: ${t.id} with data: ${t.data} ${time}`

      case 'acquire':
        if (t.target === 'topgg') return `${delta} for voting on top.gg ${time}`
        return `${delta} through ${t.target} ${time}`
    }
  }

}
