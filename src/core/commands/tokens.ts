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
    const tokenDisplay = t.delta === 0
      ? project.display.token_name_zero
      : (t.delta === 1 || t.delta === -1)
          ? project.display.token_name_one
          : project.display.token_name_multiple
    const delta = t.delta < 0 ? t.delta : ('+' + t.delta)
    switch (t.type) {
      case 'purchase': return `• ${delta} ${tokenDisplay}, purchased ${t.target}`
      case 'fund': return `• ${delta} ${tokenDisplay}, funded ${t.target}`
      case 'acquire': return `• ${delta} ${tokenDisplay}, through ${t.target}`
      case 'admin': return `• ${delta} ${tokenDisplay}, by **<@${t.issuer}>** for **${t.reason}**`
      case 'custom': return `• ${delta} ${tokenDisplay}, custom: ${t.id} with data: ${t.data}`
    }
  }

}
