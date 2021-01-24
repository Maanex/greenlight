import Const from 'const'
import DatabaseManager from 'core/database-manager'
import { MessageEmbed } from 'discord.js'
import { Goal } from '../types'
import { generateProgressBar } from './emoji-progessbar'


export default async function generateEmbedFromGoal(goal: Goal): Promise<Partial<MessageEmbed>> {
  const project = await DatabaseManager.getProjectById(goal.projectid)
  const reached = goal.cost === goal.current

  const description = [
    'The currencies requested include Pounds and one other I don\'t remember. Once this suggestion is greenlight, we will ask you which currencies you would like to see.',
    !reached ? '' : `\n${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}**Reached!**`,
    Const.EMOJIS.WHITESPACE + ' ' + generateProgressBar(goal.current / goal.cost, 7) + Const.EMOJIS.WHITESPACE + ` ** ${goal.current}/${goal.cost}**`,
    '',
    `*${project.display.token_icon_one} contribute 1 ${project.display.token_name_one} ${Const.EMOJIS.WHITESPACE} ${project.display.token_icon_multiple} contribute 5 ${project.display.token_name_multiple}*`
  ].join('\n')

  return {
    title: 'Add more currencies',
    description,
    color: reached ? 0x45B583 : 0x1F2324
  }
}
