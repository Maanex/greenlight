import { TextChannel } from 'discord.js'
import { Core, GreenlightBot } from '../index'
import Database from '../database/database'
import { Goal, Project, Transaction, User } from '../types'


export default class DatabaseManager {

  public static init(_bot: GreenlightBot) {
  }

  //

  private static projectsCacheDataById: Map<string, Project> = new Map()
  private static projectsCacheDataByGuild: Map<string, Project> = new Map()
  private static projectsCacheLastUpdate: number = 0
  private static readonly projectsCacheLifetime: number = 1000 * 60 * 10

  private static async updateCache() {
    if (Date.now() - this.projectsCacheLastUpdate > this.projectsCacheLifetime) {
      const projects = await this.fetchProjects()
      this.projectsCacheDataById = new Map()
      this.projectsCacheDataByGuild = new Map()
      projects.forEach((p) => {
        this.projectsCacheDataById.set(p._id, p)
        this.projectsCacheDataByGuild.set(p.discord_guild_id + '', p)
      })
      this.projectsCacheLastUpdate = Date.now()
    }
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
        const channel = guild.channels.resolve(g.message_channel) as TextChannel
        const message = await channel.messages.fetch(g.message_id)

        return {
          ...g,
          message,
          addPledge(amount: number, user: string) {
            const uadd = `user.${user}`
            Database
              .collection(project._id + '_goals')
              .updateOne(
                { _id: g._id },
                { $inc: { current: amount, [uadd]: amount } }
              )
          }
        }
      }))
    } catch (err) {
      return null
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
