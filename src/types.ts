/* eslint-disable camelcase */

import { MessageEmbed } from 'discord.js'


export type Interaction = {
  type: number,
  token: string,
  member: {
    user: {
      id: string,
      username: string,
      avatar: string,
      discriminator: string,
      public_flags: number
    },
    roles: string[],
    premium_since: string | null,
    permissions: string,
    pending: boolean,
    nick: string | null,
    mute: boolean,
    joined_at: string,
    is_pending: boolean,
    deaf: boolean,
  },
  id: string,
  guild_id: string,
  data: {
    options: {
      name: string,
      value: string | number
    }[],
    name: string,
    id: string
  },
  channel_id: string
}

export type InteractionResponseType = 'Pong' | 'Acknowledge' | 'ChannelMessage' | 'ChannelMessageWithSource' | 'AcknowledgeWithSource'

export enum InteractionResponseFlags {
  EPHEMERAL = 64
}

export type InteractionApplicationCommandCallbackData = {
  tts?: boolean,
  content: string,
  flags?: InteractionResponseFlags
  embeds?: MessageEmbed[],
  allowed_mentions?: any
}

export type ReplyFunction = (type: InteractionResponseType, data?: InteractionApplicationCommandCallbackData) => void

export abstract class CommandHandler {

  public abstract handle(command: Interaction, reply: ReplyFunction)

}

export interface Project {
  _id: string,
  discord_guild_ids: string[],
  admins: string[],
  display: {
    token_icon: string,
    token_name_zero: string,
    token_name_one: string,
    token_name_multiple: string
  },
  texts: {
    info: string,
    get_tokens: string
  },
  integrations?: {
    topgg?: {
      bots: {
        id: string,
        auth: string,
        reward: number,
        reward_weekend?: number
      }[],
      announce: {
        location: 'dm' | string,
        text: string,
        text_weekend?: string
      }
    }
  }
}

export type Transaction = ({
  type: 'purchase' | 'fund' | 'acquire',
  target: string
} | {
  type: 'admin',
  issuer: string,
  reason: string
} | {
  type: 'custom',
  id: string,
  data: string
}) & {
  delta: number,
  timestamp: number,
}

export interface User {
  _id: string,
  tokens: number,
  transactions: Transaction[]
}
