import { Message } from 'discord.js'
import generateEmbedFromGoal from '../lib/goal-as-embed'
import { Goal } from '../types'
import DatabaseManager from './database-manager'


export default class GoalHandler {

  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly goal: Goal
  ) {}

  public async forMessage(message: Message): Promise<GoalHandler> {
    const project = await DatabaseManager.getProjectByGuild(message.guild.id)
    const goal = project.goals.find(g => g.message_id === message.id)
    return new GoalHandler(goal)
  }

  public async forId(projectid: string, id: number): Promise<GoalHandler> {
    const project = await DatabaseManager.getProjectById(projectid)
    const goal = project.goals.find(g => g._id === id)
    return new GoalHandler(goal)
  }

  //

  public async updateMessage() {
    const embed = await generateEmbedFromGoal(this.goal)
    this.goal.message.edit('', { embed })
  }

}
