import notSetup from '../helper/not-setup-cmdh'
import DatabaseManager from '../database-manager'
import { Interaction, CommandHandler, ReplyFunction, Project, InteractionResponseFlags } from '../../types'
import { generateProgressBar } from '../../lib/emoji-progessbar'


export default class AdminHandler extends CommandHandler {

  public async handle(command: Interaction, reply: ReplyFunction) {
    if (await notSetup(command, reply)) return

    const project = await DatabaseManager.getProjectByGuild(command.guild_id)
    if (!project.admins.includes(command.member.user.id)) {
      reply('ChannelMessageWithSource', {
        content: 'I told you you can\'t do this. Stop it. Bad!',
        flags: InteractionResponseFlags.EPHEMERAL
      })
      return
    }

    for (const subcmd of command.data.options) {
      const options: any = {}
      for (const option of (<any> subcmd).options)
        options[option.name] = option.value

      switch (subcmd.name) {
        case 'tokens': return AdminHandler.subcmdTokens(command, options, project, reply)
        case 'test': return AdminHandler.subcmdTest(command, options, project, reply)
      }
    }
  }

  private static async subcmdTokens(command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    if (!options.user || !options.amount || !options.reason) return

    const failed = await DatabaseManager.modTokens(options.user + '', project._id, <number> options.amount, {
      type: 'admin',
      issuer: command.member.user.id,
      delta: <number> options.amount,
      timestamp: Date.now() / 1000,
      reason: options.reason + ''
    })

    reply('ChannelMessageWithSource', {
      content: !failed
        ? `**Success!** You changed <@${options.user}>'s tokens by ${options.amount} with reason *${options.reason}*`
        : '**Error!** Here is what went wrong:\n```' + failed + '```',
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }

  private static async subcmdTest(command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    const prog = Math.random()
    const width = Math.floor(Math.random() * 10) + 2
    const text = `${prog} • ${width}\n${generateProgressBar(prog, width)}`
  }

}
