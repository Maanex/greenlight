import { GreenlightBot } from 'index'
import Database from '../database/database'
import { Project, Transaction, User } from '../types'


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
        p.discord_guild_ids.forEach(gid => this.projectsCacheDataByGuild.set(gid, p))
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

  private static fetchProjects(): Promise<Project[]> {
    return Database
      .collection('_projects')
      .find({})
      .toArray()
  }

  //

  public static async getUser(userId: string, projectId: string): Promise<User | null> {
    try {
      const user: User = await Database
        .collection(projectId)
        .findOne({ _id: userId })
      return user || null
    } catch (err) {
      return null
    }
  }

  public static async modTokens(userId: string, projectId: string, delta: number, transaction?: Transaction): Promise<string> {
    try {
      if (await this.getUser(userId, projectId)) {
        await Database
          .collection(projectId)
          .updateOne(
            { _id: userId },
            {
              $inc: { tokens: delta },
              $push: { transactions: transaction }
            }
          )
      } else {
        await Database
          .collection(projectId)
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
