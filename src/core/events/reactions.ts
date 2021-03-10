import { MessageReaction, PartialUser, User } from 'discord.js'
import { Project } from 'types'
import StoreHandler from '../store-handler'
import DatabaseManager from '../../core/database-manager'
import { GreenlightBot } from '../../index'


export default class ReactionsListener {

  public static init(bot: GreenlightBot) {
    bot.on('messageReactionAdd', (e, u) => ReactionsListener.onReaction(e, u))
  }

  private static async onReaction(e: MessageReaction, u: User | PartialUser) {
    if (u.bot) return

    const project = await DatabaseManager.getProjectByGuild(e.message.guild.id)
    if (!project) return

    this.handleGoals(e, u, project)
    this.handleStore(e, u, project)
  }

  private static async handleGoals(e: MessageReaction, u: User | PartialUser, project: Project) {
    const goal = await DatabaseManager.getGoalFromMessage(e.message.id)
    if (!goal) return

    const allowedReactions = [
      project.display.token_icon_one,
      project.display.token_icon_multiple
    ]
    if (!allowedReactions.includes(e.emoji.toString())) return

    const amount = allowedReactions.indexOf(e.emoji.toString()) * 4 + 1 // TODO make a proper thing here

    goal.addPledge(amount, u.id)
    e.users.remove(u.id)
  }

  private static handleStore(e: MessageReaction, u: User | PartialUser, project: Project) {
    if (e.message.id !== project.store.message_id) return

    StoreHandler.forProject(project).userPurchaseAttempt(u as User, e.emoji.toString())
    e.users.remove(u.id)
  }

}
