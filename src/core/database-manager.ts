import { TextChannel } from 'discord.js'
import { Core, GreenlightBot } from '../index'
import Database from '../database/database'
import { Goal, Project, Transaction, User } from '../types'
import GoalHandler from './goal-handler'


export default class DatabaseManager {

  public static init(bot: GreenlightBot) {
    bot.on('ready', () => {
      this.updateCache()
    })
  }

  //

  private static projectsCacheDataById: Map<string, Project> = new Map()
  private static projectsCacheDataByGuild: Map<string, Project> = new Map()
  private static goalsCacheDataByMessage: Map<string, Goal> = new Map()
  private static projectsCacheLastUpdate: number = 0
  private static readonly projectsCacheLifetime: number = 1000 * 60 * 10

  public static async updateCache(force = false) {
    if (!force && (Date.now() - this.projectsCacheLastUpdate < this.projectsCacheLifetime)) return

    const projects = await this.fetchProjects()
    this.projectsCacheDataById = new Map()
    this.projectsCacheDataByGuild = new Map()
    this.goalsCacheDataByMessage = new Map()
    projects.forEach((p) => {
      this.projectsCacheDataById.set(p._id, p)
      this.projectsCacheDataByGuild.set(p.discord_guild_id + '', p)
      p.goals.forEach((g) => {
        this.goalsCacheDataByMessage.set(g.message_id, g)
      })
    })
    this.projectsCacheLastUpdate = Date.now()
  }

  public static async getProjectById(id: string): Promise<Project | null> {
    await this.updateCache()
    return this.projectsCacheDataById.get(id) || null
  }

  public static async getProjectByGuild(id: string): Promise<Project | null> {
    await this.updateCache()
    return this.projectsCacheDataByGuild.get(id) || null
  }

  public static async findProject(search: (project: Project) => boolean): Promise<Project | null> {
    await this.updateCache()
    for (const p of this.projectsCacheDataById.values())
      if (search(p)) return p
    return null
  }

  public static async getProjects(): Promise<IterableIterator<Project>> {
    await this.updateCache()
    return this.projectsCacheDataById.values()
  }

  public static async getGoalFromMessage(id: string): Promise<Goal | null> {
    await this.updateCache()
    return this.goalsCacheDataByMessage.get(id) || null
  }

  private static async fetchProjects(): Promise<Project[]> {
    const projects = await Database
      .collection('_projects')
      .find({})
      .toArray()

    return Promise.all(projects.map(async (p: Project) => ({
      ...p, goals: await this.getGoals(p)
    })))
  }

  //

  public static async getUser(userId: string, projectId: string): Promise<User | null> {
    try {
      const user: User = await Database
        .collection(projectId + '_users')
        .findOne({ _id: userId })
      return user || null
    } catch (err) {
      return null
    }
  }

  public static async getGoals(project: Project): Promise<Goal[]> {
    try {
      const goals: Goal[] = await Database
        .collection(project._id + '_goals')
        .find({})
        .toArray()

      if (!goals || !goals.length) return []

      return Promise.all(goals.map(async (g: Goal) => {
        const guild = await Core.guilds.fetch(project.discord_guild_id)
        if (!guild) return
        const channel = guild.channels.resolve(g.message_channel) as TextChannel
        if (!channel) return
        const message = await channel.messages.fetch(g.message_id)

        return {
          ...g,
          message,
          projectid: project._id,
          recents: {},
          addPledge(amount: number, user: string) {
            GoalHandler.forGoal(this).addPledge(amount, user)
          }
        }
      }))
    } catch (err) {
      return null
    }
  }

  public static async addGoal(project: Project, goal: Goal): Promise<boolean> {
    try {
      const insert = JSON.parse(JSON.stringify(goal))
      delete insert.message
      delete insert.projectid
      delete insert.recents
      delete insert.addPledge

      await Database
        .collection(project._id + '_goals')
        .insertOne(insert)
      this.updateCache(true)
      return true
    } catch (err) {
      return false
    }
  }

  public static async modTokens(userId: string, projectId: string, delta: number, transaction?: Transaction): Promise<string> {
    try {
      if (await this.getUser(userId, projectId)) {
        await Database
          .collection(projectId + '_users')
          .updateOne(
            { _id: userId },
            {
              $inc: { tokens: delta },
              $push: { transactions: transaction }
            }
          )
      } else {
        await Database
          .collection(projectId + '_users')
          .insertOne(<User> {
            _id: userId,
            tokens: delta,
            transactions: [ transaction ]
          })
      }
      return ''
    } catch (err) {
      return err
    }
  }

}
