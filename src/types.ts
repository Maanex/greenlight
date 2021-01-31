/* eslint-disable camelcase */

import { Message, MessageEmbed } from 'discord.js'


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
  embeds?: Partial<MessageEmbed>[],
  allowed_mentions?: any
}

export type ReplyFunction = (type: InteractionResponseType, data?: InteractionApplicationCommandCallbackData) => void

export abstract class CommandHandler {

  public abstract handle(command: Interaction, reply: ReplyFunction)

}

export interface Goal {
  readonly _id: number,
  readonly cost: number,
  current: number,
  readonly title: string,
  readonly description: string,
  readonly message_channel: string
  readonly message_id: string,
  user: {
    [userid: string]: number
  },

  // runtime
  readonly projectid: string,
  readonly message: Message,
  recents: {
    [userid: string]: number
  },
  addPledge(amount: number, user: string)
}

export interface Project {
  readonly _id: string,
  readonly discord_guild_id: string,
  readonly admins: string[],
  readonly display: {
    readonly token_icon_one: string,
    readonly token_icon_multiple: string,
    readonly token_name_zero: string,
    readonly token_name_one: string,
    readonly token_name_multiple: string
  },
  readonly texts: {
    readonly info: string,
    readonly get_tokens: string
  },
  readonly integrations?: {
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
  },
  readonly goals: Goal[]
}

export type Transaction = ({
  type: 'purchase' | 'pledge',
  target: number
} | {
  type: 'acquire',
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
