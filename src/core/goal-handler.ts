/* eslint-disable no-undef */
import Axios from 'axios'
import { GreenlightBot } from 'index'
import Database from '../database/database'
import generateEmbedFromGoal from '../lib/goal-as-embed'
import { Goal } from '../types'
import DatabaseManager from './database-manager'


export default class GoalHandler {

  private static goalUpdateQueue: string[] = [] // goal message ids
  private static userRecentsTimeout: Map<string, NodeJS.Timeout> = new Map()
  private static goalRecents: Map<number, Map<string, number>> = new Map()

  public static init(_bot: GreenlightBot) {
    setInterval(async () => {
      if (!GoalHandler.goalUpdateQueue.length) return

      const update = GoalHandler.goalUpdateQueue.splice(0, 4)
      const mapped = await Promise.all(update.map(m => GoalHandler.forMessage(m)))
      mapped.forEach(m => m.updateMessage())
    }, 1000)
  }

  //

  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly goal: Goal
  ) { }

  public static forGoal(goal: Goal): GoalHandler {
    return new GoalHandler(goal)
  }

  public static async forMessage(id: string): Promise<GoalHandler> {
    const goal = await DatabaseManager.getGoalFromMessage(id)
    return new GoalHandler(goal)
  }

  public static async forId(projectid: string, id: number): Promise<GoalHandler> {
    const project = await DatabaseManager.getProjectById(projectid)
    const goal = project.goals.find(g => g._id === id)
    return new GoalHandler(goal)
  }

  //

  public async updateMessage() {
    const embed = await generateEmbedFromGoal(this.goal, GoalHandler.goalRecents.get(this.goal._id) || new Map())
    this.goal.message.edit('', { embed })
  }

  public async addPledge(amount: number, user: string) {
    const userdata = await DatabaseManager.getUser(user, this.goal.projectid)
    const goalRecents = GoalHandler.goalRecents.get(this.goal._id) || new Map()
    const usertokens = userdata ? (userdata.tokens - Math.abs(goalRecents.get(user) || 0)) : 0
    const isGoalComplete = this.goal.current >= this.goal.cost

    if (usertokens >= amount) {
      this.goal.current += amount
      goalRecents.set(user, (goalRecents.get(user) || 0) + amount)
    } else if (usertokens > 0) {
      amount = usertokens
      this.goal.current += usertokens
      goalRecents.set(user, (goalRecents.get(user) || 0) + usertokens)
    } else {
      amount = 0
      const rn = goalRecents.get(user)
      if (!rn) goalRecents.set(user, 0)
      else if (rn > 0) goalRecents.set(user, -rn)
    }

    if (!isGoalComplete && this.goal.current >= this.goal.cost)
      this.postGoalCompleteMessage()

    if (!GoalHandler.goalUpdateQueue.includes(this.goal.message_id))
      GoalHandler.goalUpdateQueue.push(this.goal.message_id)

    if (GoalHandler.userRecentsTimeout.has(user))
      clearTimeout(GoalHandler.userRecentsTimeout.get(user))

    const timeout = setTimeout(() => {
      GoalHandler.userRecentsTimeout.delete(user)
      const goalRecents = GoalHandler.goalRecents.get(this.goal._id)
      let finalAmount = goalRecents.get(user)
      goalRecents.delete(user)
      if (!GoalHandler.goalUpdateQueue.includes(this.goal.message_id))
        GoalHandler.goalUpdateQueue.push(this.goal.message_id)

      GoalHandler.goalRecents.set(this.goal._id, goalRecents)

      if (finalAmount === 0) return
      finalAmount = Math.abs(finalAmount)

      const uadd = `user.${user}`
      Database
        .collection(this.goal.projectid + '_goals')
        .updateOne(
          { _id: this.goal._id },
          { $inc: { current: finalAmount, [uadd]: finalAmount } }
        )

      if (finalAmount) {
        DatabaseManager.modTokens(user, this.goal.projectid, -finalAmount, {
          type: 'pledge',
          delta: -finalAmount,
          target: this.goal._id,
          timestamp: ~~(Date.now() / 1000)
        })
      }
    }, 10000)
    GoalHandler.userRecentsTimeout.set(user, timeout)
    GoalHandler.goalRecents.set(this.goal._id, goalRecents)
  }

  public async postGoalCompleteMessage() {
    const project = await DatabaseManager.getProjectById(this.goal.projectid)
    if (!project.goal_complete_webhook) return

    Axios.post(project.goal_complete_webhook, {
      embeds: [ {
        title: 'Goal complete!',
        description: `Goal "${this.goal.title}" reached it's goal of ${this.goal.cost} ${project.display.token_name_multiple}!\n[Go to message](${this.goal.message.url})`
      } ]
    })
  }

}
