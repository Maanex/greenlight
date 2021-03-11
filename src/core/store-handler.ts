/* eslint-disable no-undef */
import Axios from 'axios'
import { GuildMember, TextChannel, User } from 'discord.js'
import { Core, GreenlightBot } from '../index'
import { generateStoreWidget } from '../lib/store-widget'
import { User as UserData, Product, Project } from '../types'
import DatabaseManager from './database-manager'


export default class StoreHandler {

  private static storeUpdateQueue: string[] = [] // project ids
  private static userRecentsData: Map<string, string> = new Map()
  private static userRecentsTimeout: Map<string, NodeJS.Timeout> = new Map()

  public static init(_bot: GreenlightBot) {
    setInterval(async () => {
      if (!StoreHandler.storeUpdateQueue.length) return

      const update = StoreHandler.storeUpdateQueue.splice(0, 4)
      const mapped = await Promise.all(update.map(p => StoreHandler.forProjectId(p)))
      mapped.forEach(m => m.updateMessage())
    }, 1000)
  }

  //

  // eslint-disable-next-line no-useless-constructor
  private constructor(
    private readonly project: Project
  ) { }

  public static forProject(project: Project): StoreHandler {
    return new StoreHandler(project)
  }

  public static async forProjectId(projectid: string): Promise<StoreHandler> {
    const project = await DatabaseManager.getProjectById(projectid)
    return StoreHandler.forProject(project)
  }

  //

  public async updateMessage() {
    const recents = [ ...StoreHandler.userRecentsData.keys() ]
      .map(user => `<@${user}> ${StoreHandler.userRecentsData.get(user)}`)
    const embed = await generateStoreWidget(this.project, recents)
    const guild = await Core.guilds.fetch(this.project.discord_guild_id)
    const channel = guild.channels.resolve(this.project.store.channel_id) as TextChannel
    const message = await channel.messages.fetch(this.project.store.message_id)
    message.edit('** **\n** **', embed)
  }

  public async userPurchaseAttempt(user: User, emoji: String) {
    const product = this.project.store.products.find(p => p.emoji === emoji)
    if (!product) return

    const userdata = await DatabaseManager.getUser(user.id, this.project._id)
    if (!userdata) {
      this.queueUserRecent(user.id, `You don't have any ${this.project.display.token_name_multiple} to spend!`)
      return
    }

    const guild = await Core.guilds.fetch(this.project.discord_guild_id)
    const member = await guild.members.fetch(user.id)
    if (!this.canUserBuy(member, userdata, product)) {
      this.queueUserRecent(user.id, 'You already bought this item!')
      return
    }

    if (userdata.tokens < product.price) {
      this.queueUserRecent(user.id, `You only have **${userdata.tokens}** ${this.project.display.token_name_multiple}. This is not enough to purchase this item!`)
      return
    }

    DatabaseManager.modTokens(user.id, this.project._id, -product.price, {
      type: 'purchase',
      delta: -product.price,
      target: product.name,
      timestamp: ~~(Date.now() / 1000)
    })

    // if successfull
    this.fulfillUserPurchase(member, userdata, product)
    this.postStorePuchaseMessage(user, product)
    this.queueUserRecent(user.id, `You just purchased **${product.name}**! Enjoy :)`)
  }

  private queueUserRecent(user: string, text: string) {
    if (!StoreHandler.storeUpdateQueue.includes(this.project._id))
      StoreHandler.storeUpdateQueue.push(this.project._id)
    StoreHandler.userRecentsData.set(user, text)
    if (StoreHandler.userRecentsTimeout.has(user))
      clearTimeout(StoreHandler.userRecentsTimeout.get(user))
    StoreHandler.userRecentsTimeout.set(user, setTimeout(() => {
      if (!StoreHandler.storeUpdateQueue.includes(this.project._id))
        StoreHandler.storeUpdateQueue.push(this.project._id)
      StoreHandler.userRecentsData.delete(user)
      StoreHandler.userRecentsTimeout.delete(user)
    }, 10000))
  }

  public canUserBuy(member: GuildMember, _userdata: UserData, product: Product): boolean {
    switch (product.type) {
      case 'role':
        return !member.roles.cache.has(product.id)

      default: return true
    }
  }

  public async fulfillUserPurchase(member: GuildMember, _userdata: UserData, product: Product) {
    switch (product.type) {
      case 'role': {
        const role = await member.guild.roles.fetch(product.id)
        member.roles.add(role)
        break
      }

      default:
        break
    }
  }

  public postStorePuchaseMessage(user: User, product: Product) {
    if (!this.project.item_purchase_webhook) return

    Axios.post(this.project.item_purchase_webhook, {
      embeds: [ {
        title: 'New purchase!',
        description: `${user.toString()} purchased ${product.name}`
      } ]
    })
  }

}
