import DatabaseManager from '../database-manager'
import { Interaction, InteractionResponseFlags, ReplyFunction } from '../../types'


export default async function notSetup(command: Interaction, reply: ReplyFunction): Promise<boolean> {
  if (await DatabaseManager.getProjectByGuild(command.guild_id)) return false
  reply('ChannelMessageWithSource', {
    content: 'Greenlight is not set up on this server!',
    flags: InteractionResponseFlags.EPHEMERAL
  })
  return true
}
