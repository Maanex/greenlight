import * as moment from 'moment'
import notSetup from '../helper/not-setup-cmdh'
import DatabaseManager from '../database-manager'
import { Interaction, InteractionResponseFlags, CommandHandler, ReplyFunction, Transaction, Project } from '../../types'


export default class TokensHandler extends CommandHandler {

  public async handle(command: Interaction, reply: ReplyFunction) {
    if (await notSetup(command, reply)) return

    const project = await DatabaseManager.getProjectByGuild(command.guild_id)
    const user = await DatabaseManager.getUser(command.member.user.id, project._id)

    let text = ''
    if (user) {
      text = `**You have ${user.tokens} ${project.display.token_icon}**\n\nRecent transactions:\n`
      text += user
        .transactions
        .reverse()
        .splice(0, 5)
        .map(t => TokensHandler.transactionToText(t, project))
        .join('\n')
    } else {
      text = `**You have 0 ${project.display.token_icon}**\n\n${project.texts.get_tokens}`
    }

    reply('ChannelMessageWithSource', {
      content: text,
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }

  private static transactionToText(t: Transaction, project: Project): string {
    const token = project.display.token_icon
    const delta = t.delta < 0 ? t.delta : ('+' + t.delta)
    const time = `(${moment(t.timestamp * 1000).fromNow()})`
    switch (t.type) {
      case 'purchase': return `${delta} ${token}, purchased ${t.target} ${time}`
      case 'fund': return `${delta} ${token}, funded ${t.target} ${time}`
      case 'admin': return `${delta} ${token}, by **<@${t.issuer}>** for **${t.reason}** ${time}`
      case 'custom': return `${delta} ${token}, custom: ${t.id} with data: ${t.data} ${time}`

      case 'acquire':
        if (t.target === 'topgg') return `${delta} ${token} for voting on top.gg ${time}`
        return `${delta} ${token}, through ${t.target} ${time}`
    }
  }

}
