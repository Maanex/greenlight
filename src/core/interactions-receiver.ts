import Axios from 'axios'
import { Interaction, InteractionApplicationCommandCallbackData, InteractionResponseType, CommandHandler, ReplyFunction } from '../types'
import { GreenlightBot } from '../index'
import TokensHandler from './commands/tokens'
import AdminHandler from './commands/admin'


export default class InteractionReceiver {

  private static readonly HANDLER: { [token: string]: CommandHandler } = {}

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
    if (this.HANDLER[i.data.name])
      this.HANDLER[i.data.name].handle(i, this.getReplyFunction(i))
    else
      console.log(`Unhandled command "${i.data.name}"`)
  }

  private static getReplyFunction(i: Interaction): ReplyFunction {
    return (type: InteractionResponseType, data?: InteractionApplicationCommandCallbackData) => {
      const types: InteractionResponseType[] = [ 'Pong', 'Acknowledge', 'ChannelMessage', 'ChannelMessageWithSource', 'AcknowledgeWithSource' ]
      Axios.post(`https://discord.com/api/v8/interactions/${i.id}/${i.token}/callback`, { type: types.indexOf(type), data })
    }
  }

}
