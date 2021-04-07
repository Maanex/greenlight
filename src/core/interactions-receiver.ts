import Axios from 'axios'
import { Interaction, InteractionApplicationCommandCallbackData, InteractionResponseType, CommandHandler, ReplyFunction } from '../types'
import { GreenlightBot } from '../index'
import TokensHandler from './commands/tokens'
import AdminHandler from './commands/admin'


export default class InteractionReceiver {

  public static readonly HANDLER: { [token: string]: CommandHandler } = {}

  public static init(bot: GreenlightBot) {
    bot.on('raw', (event: Event) => {
      const ev: any = event
      if (ev.t === 'INTERACTION_CREATE')
        this.onInteraction(ev.d)
    })

    this.HANDLER.tokens = new TokensHandler()
    this.HANDLER.admin = new AdminHandler()
  }

  private static onInteraction(i: Interaction) {
    if (!i.guild_id) return
    if (this.HANDLER[i.data.name])
      this.HANDLER[i.data.name].handle(i, this.getReplyFunction(i))
    else
      console.log(`Unhandled command "${i.data.name}"`)
  }

  private static getReplyFunction(i: Interaction): ReplyFunction {
    const types: InteractionResponseType[] = [ 'Pong', 'deprecated-Acknowledge', 'deprecated-ChannelMessage', 'ChannelMessageWithSource', 'DeferredChannelMessageWithSource' ]
    return (type: InteractionResponseType, data?: InteractionApplicationCommandCallbackData) => {
      Axios.post(`https://discord.com/api/v8/interactions/${i.id}/${i.token}/callback`, { type: types.indexOf(type) + 1, data })
    }
  }

}
