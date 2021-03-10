import { TextChannel } from 'discord.js'
import { generateAboutWidget } from '../../lib/about-widget'
import { generateStoreWidget } from '../../lib/store-widget'
import notSetup from '../helper/not-setup-cmdh'
import DatabaseManager from '../database-manager'
import { Interaction, CommandHandler, ReplyFunction, Project, InteractionResponseFlags, Goal } from '../../types'
import Const from '../../const'
import { Core } from '../../index'
import GoalHandler from '../../core/goal-handler'
import Database from '../../database/database'


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
        case 'addgoal': return AdminHandler.subcmdAddgoal(command, options, project, reply)
        case 'removegoal': return AdminHandler.subcmdRemovegoal(command, options, project, reply)
        case 'goalinfo': return AdminHandler.subcmdGoalinfo(command, options, project, reply)
        case 'editgoal': return AdminHandler.subcmdEditgoal(command, options, project, reply)
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

  private static async subcmdTest(command: Interaction, _options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    reply('Acknowledge')

    const guild = await Core.guilds.fetch(command.guild_id)
    const channel = guild.channels.resolve(command.channel_id) as TextChannel
    await channel.send(Const.EMOJIS.WHITESPACE, generateStoreWidget(project, []))
  }

  private static async subcmdAddgoal(command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    reply('Acknowledge')

    const guild = await Core.guilds.fetch(command.guild_id)
    const channel = guild.channels.resolve(options.channel + '') as TextChannel

    const messages = await channel.messages.fetch()
    if (!(await DatabaseManager.getGoalFromMessage(messages.firstKey())))
      messages.first()?.delete()
    if (project.store.message_id)
      channel.messages.cache.get(project.store.message_id)?.delete()

    const message = await channel.send(Const.EMOJIS.WHITESPACE)

    await message.react(project.display.token_icon_one)
    await message.react(project.display.token_icon_multiple)

    let goalId = 0
    while (project.goals.find(g => g._id === goalId))
      goalId++

    const goal: Goal = {
      _id: goalId,
      cost: parseInt(options.cost + '', 10),
      current: 0,
      title: options.title + '',
      description: options.description + '',
      message_channel: channel.id,
      message_id: message.id,
      user: {},

      // runtime
      projectid: project._id,
      message,
      recents: {},
      addPledge(amount: number, user: string) {
        GoalHandler.forGoal(goal).addPledge(amount, user)
      }
    }

    DatabaseManager.addGoal(project, goal)
    DatabaseManager.updateCache(true)
    GoalHandler.forGoal(goal).updateMessage()

    if (project.store) {
      const store = await channel.send('** **\n** **', generateStoreWidget(project, []))
      Database
        .collection('_projects')
        .updateOne(
          { _id: project._id },
          {
            $set: {
              'store.message_id': store.id,
              'store.channel_id': channel.id
            }
          }
        )

      for (const product of project.store.products)
        await store.react(product.emoji)
    }

    await channel.send('** **\n** **', generateAboutWidget(project))
  }

  private static async subcmdEditgoal(_command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    reply('Acknowledge')

    const goal = await DatabaseManager.getGoalFromMessage(options.messageid + '')
    if (!goal) return
    goal[options.property] = (options.property === 'cost') ? parseInt(options.new_value + '', 10) : options.new_value

    GoalHandler.forGoal(goal).updateMessage()
    const query = {
      $set: { [options.property]: goal[options.property] }
    }
    Database
      .collection(project._id + '_goals')
      .updateOne({ _id: goal._id }, query)
  }

  private static async subcmdRemovegoal(_command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    reply('Acknowledge')

    const goal = await DatabaseManager.getGoalFromMessage(options.messageid + '')
    if (!goal) return

    await Database
      .collection(project._id + '_goals')
      .deleteOne({ _id: goal._id })

    goal.message.delete()

    DatabaseManager.updateCache(true)
  }

  private static async subcmdGoalinfo(_command: Interaction, options: { [name: string]: string | number }, _project: Project, reply: ReplyFunction) {
    const goal = await DatabaseManager.getGoalFromMessage(options.messageid + '')
    if (!goal) {
      reply('ChannelMessage', {
        content: "That's not a goal :/",
        flags: InteractionResponseFlags.EPHEMERAL
      })
      return
    }

    reply('ChannelMessage', {
      content: `**${goal.title}**\n` + Object.keys(goal.user).map(k => `• <@${k}> ${goal.user[k]}`).join('\n'),
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }

}
