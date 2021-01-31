import { MessageEmbed } from 'discord.js'
import Const from '../const'
import DatabaseManager from '../core/database-manager'
import { Goal } from '../types'
import { generateProgressBar } from './emoji-progessbar'


export default async function generateEmbedFromGoal(goal: Goal): Promise<Partial<MessageEmbed>> {
  const project = await DatabaseManager.getProjectById(goal.projectid)
  const reached = goal.current >= goal.cost

  const reachedText = reached
    ? `\n${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}**Reached!**`
    : ''

  const recentsText = Object.keys(goal.recents).length
    ? '\n' + Object.keys(goal.recents).map((uid) => {
        let out = `<@${uid}>`
        if (goal.recents[uid] !== 0)
          out += ` contributed ${Math.abs(goal.recents[uid])} ${([ project.display.token_name_zero, project.display.token_name_one ])[Math.abs(goal.recents[uid])] || project.display.token_name_multiple}.`
        if (goal.recents[uid] <= 0)
          out += ` You don't have any ${project.display.token_name_multiple} left to spend!`
        return out
      }).join('\n') + '\n'
    : ''

  const description = [
    goal.description,
    reachedText || '',
    Const.EMOJIS.WHITESPACE + ' ' + generateProgressBar(goal.current / goal.cost, 7) + Const.EMOJIS.WHITESPACE + ` ** ${goal.current}/${goal.cost}**`,
    recentsText || '',
    `*${project.display.token_icon_one} contribute 1 ${project.display.token_name_one} ${Const.EMOJIS.WHITESPACE} ${project.display.token_icon_multiple} contribute 5 ${project.display.token_name_multiple}*`
  ].join('\n')

  return {
    title: goal.title,
    description,
    color: reached ? 0x45B583 : 0x1F2324
  }
}
