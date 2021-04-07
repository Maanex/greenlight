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
import InteractionReceiver from '../../core/interactions-receiver'


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
        case 'users': return AdminHandler.subcmdUsers(command, options, project, reply)
        case 'finishgoal': return AdminHandler.subcmdFinishgoal(command, options, project, reply)
      }
    }
  }

  private static async subcmdTokens(command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    if (!options.user || !options.amount || !options.reason) return

    const failed = await DatabaseManager.modTokens(options.user + '', project._id, <number>options.amount, {
      type: 'admin',
      issuer: command.member.user.id,
      delta: <number>options.amount,
      timestamp: ~~(Date.now() / 1000),
      reason: options.reason + ''
    })

    reply('ChannelMessageWithSource', {
      content: !failed
        ? `**Success!** You changed <@${options.user}>'s tokens by ${options.amount} with reason *${options.reason}*`
        : '**Error!** Here is what went wrong:\n```' + failed + '```',
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }

  private static async subcmdTest(command: Interaction, _options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    reply('ChannelMessageWithSource', {
      content: 'ok',
      flags: InteractionResponseFlags.EPHEMERAL
    })

    const guild = await Core.guilds.fetch(command.guild_id)
    const channel = guild.channels.resolve(command.channel_id) as TextChannel
    await channel.send(Const.EMOJIS.WHITESPACE, generateStoreWidget(project, []))
  }

  private static async subcmdAddgoal(command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    reply('ChannelMessageWithSource', {
      content: 'ok',
      flags: InteractionResponseFlags.EPHEMERAL
    })

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
      finished: false,
      title: options.title + '',
      description: options.description + '',
      message_channel: channel.id,
      message_id: message.id,
      user: {},

      // runtime
      projectid: project._id,
      message,
      addPledge(amount: number, user: string) {
        GoalHandler.forGoal(goal).addPledge(amount, user)
      }
    }

    DatabaseManager.addGoal(project, goal)
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
    reply('ChannelMessageWithSource', {
      content: 'ok',
      flags: InteractionResponseFlags.EPHEMERAL
    })

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
    reply('ChannelMessageWithSource', {
      content: 'ok',
      flags: InteractionResponseFlags.EPHEMERAL
    })

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
      reply('ChannelMessageWithSource', {
        content: "That's not a goal :/",
        flags: InteractionResponseFlags.EPHEMERAL
      })
      return
    }

    reply('ChannelMessageWithSource', {
      content: `**${goal.title}**\n` + Object.keys(goal.user).map(k => `• <@${k}> ${goal.user[k]}`).join('\n'),
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }

  private static async subcmdUsers(command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    const target = (options.target + '').toLowerCase()

    if (target === 'top') {
      const top = await Database
        .collection(project._id + '_users')
        .find({ tokens: { $gt: 0 } })
        .sort({ tokens: -1 })
        .limit(20)
        .toArray()
      reply('ChannelMessageWithSource', {
        content: top
          .map(t => `<@${t._id}> ${t.tokens} ${project.display.token_name_multiple}`)
          .join('\n'),
        flags: InteractionResponseFlags.EPHEMERAL
      })
      return
    }

    if (target === 'total') {
      let top = await Database
        .collection(project._id + '_users')
        .find({ })
        .toArray()
      top = top
        .map(t => ({ ...t, gains: this.aggreagteGainTransactions(t.transactions) }))
        .sort((a, b) => b.gains - a.gains)
        .slice(0, 20)
      reply('ChannelMessageWithSource', {
        content: top
          .map(t => `<@${t._id}> ${t.gains} ${project.display.token_name_multiple}`)
          .join('\n'),
        flags: InteractionResponseFlags.EPHEMERAL
      })
      return
    }

    const goal = await DatabaseManager.getGoalFromMessage(target)
    if (goal) {
      const contributions = Object
        .keys(goal.user)
        .map(k => ([ k, goal.user[k] ] as [ string, number ]))
        .sort((a, b) => b[1] - a[1])
        .map(o => `<@${o[0]}> ${o[1]} ${project.display.token_name_multiple}`)
        .join('\n')
      reply('ChannelMessageWithSource', {
        content: `**${goal.title}**\n\n${contributions}`,
        flags: InteractionResponseFlags.EPHEMERAL
      })
      return
    }

    const user = await DatabaseManager.getUser(target, project._id)
    if (user) {
      const commandCopy = JSON.parse(JSON.stringify(command))
      commandCopy.member.user.id = target
      ;(InteractionReceiver.HANDLER.tokens as CommandHandler).handle(commandCopy, reply)
      return
    }

    reply('ChannelMessageWithSource', {
      content: 'No results found for your query.',
      flags: InteractionResponseFlags.EPHEMERAL
    })
  }

  private static async subcmdFinishgoal(_command: Interaction, options: { [name: string]: string | number }, project: Project, reply: ReplyFunction) {
    reply('ChannelMessageWithSource', {
      content: 'ok',
      flags: InteractionResponseFlags.EPHEMERAL
    })

    const goal = await DatabaseManager.getGoalFromMessage(options.messageid + '')
    if (!goal) return

    goal.finished = !goal.finished

    if (goal.finished) {
      await goal.message.reactions.removeAll()
    } else {
      await goal.message.react(project.display.token_icon_one)
      await goal.message.react(project.display.token_icon_multiple)
    }

    GoalHandler.forGoal(goal).updateMessage()
    const query = {
      $set: { finished: goal.finished }
    }
    Database
      .collection(project._id + '_goals')
      .updateOne({ _id: goal._id }, query)
  }

  //

  public static aggreagteGainTransactions(array: any[]) {
    return array.reduce((p, c) => c.delta > 0 ? p + c.delta : p, 0)
  }

}
