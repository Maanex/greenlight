import { Emoji, TextChannel } from 'discord.js'
import notSetup from '../helper/not-setup-cmdh'
import DatabaseManager from '../database-manager'
import { Interaction, CommandHandler, ReplyFunction, Project, InteractionResponseFlags } from '../../types'
import { generateProgressBar } from '../../lib/emoji-progessbar'
import Const from '../../const'
import { Core } from '../../index'


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
      for (const option of (<any>subcmd).options || [])
        options[option.name] = option.value

      switch (subcmd.name) {
        case 'tokens': return AdminHandler.subcmdTokens(command, options, project, reply)
        case 'test': return AdminHandler.subcmdTest(command, options, project, reply)
      }
    }
  }

  private static async subcmdTokens(command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    if (!options.user || !options.amount || !options.reason) return

    const failed = await DatabaseManager.modTokens(options.user + '', project._id, <number>options.amount, {
      type: 'admin',
      issuer: command.member.user.id,
      delta: <number>options.amount,
      timestamp: Date.now() / 1000,
      reason: options.reason + ''
    })

    reply('ChannelMessage', {
      content: !failed
        ? `**Success!** You changed <@${options.user}>'s tokens by ${options.amount} with reason *${options.reason}*`
        : '**Error!** Here is what went wrong:\n```' + failed + '```',
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }

  private static async subcmdTest(command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    project.goals[0].addPledge(1, command.member.user.id)
    // const goal = Math.floor(Math.random() * 100) + 10
    // const pledges = Math.random() > 0.2 ? goal : Math.floor(Math.random() * goal)
    // const reached = goal === pledges

    // const description = [
    //   'The currencies requested include Pounds and one other I don\'t remember. Once this suggestion is greenlight, we will ask you which currencies you would like to see.',
    //   !reached ? '' : `\n${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}**Reached!**`,
    //   Const.EMOJIS.WHITESPACE + ' ' + generateProgressBar(pledges / goal, 7) + Const.EMOJIS.WHITESPACE + ` ** ${pledges}/${goal}**`,
    //   '',
    //   `*${project.display.token_icon_one} contribute 1 ${project.display.token_name_one} ${Const.EMOJIS.WHITESPACE} ${project.display.token_icon_multiple} contribute 5 ${project.display.token_name_multiple}*`
    // ].join('\n')

    // reply('Acknowledge')

    // const guild = await Core.guilds.fetch(command.guild_id)
    // const channel = guild.channels.resolve(command.channel_id) as TextChannel

    // const message = await channel.send(Const.EMOJIS.WHITESPACE, {
    //   embed: {
    //     title: 'Add more currencies',
    //     description,
    //     color: reached ? 0x45B583 : 0x1F2324
    //   }
    // })

    // await message.react(project.display.token_icon_one)
    // await message.react(project.display.token_icon_multiple)
  }

}
