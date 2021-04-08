import { MessageEmbed } from 'discord.js'
import Const from '../const'
import DatabaseManager from '../core/database-manager'
import { Goal } from '../types'
import { generateProgressBar } from './emoji-progessbar'


export default async function generateEmbedFromGoal(goal: Goal, goalRecents: Map<string, number>): Promise<Partial<MessageEmbed>> {
  const project = await DatabaseManager.getProjectById(goal.projectid)
  const reached = goal.current >= goal.cost

  const reachedText = reached
    ? `\n${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}**Reached!**`
    : ''

  let recentsText = ''
  if (goalRecents.size) {
    const keys = [ ...goalRecents.keys() ]
      .slice(0, 10)
      .sort((a, b) => (goalRecents.get(a) === 0 ? -1 : goalRecents.get(b) === 0 ? 1 : 0))

    const recents = keys.map((uid) => {
      let out = `<@${uid}>`
      if (goalRecents.get(uid) !== 0)
        out += ` contributed ${Math.abs(goalRecents.get(uid))} ${([ project.display.token_name_zero, project.display.token_name_one ])[Math.abs(goalRecents.get(uid))] || project.display.token_name_multiple}.`
      if (goalRecents.get(uid) <= 0)
        out += ` You don't have any ${project.display.token_name_multiple} left to spend!`
      return out
    })

    recentsText = `\n${recents.join('\n')}\n`
    if (goalRecents.size > 10)
      recentsText += `*+${goalRecents.size - recents.length} more...*\n`
  }

  /* eslint-disable indent */
  /* eslint-disable multiline-ternary */
  const description = goal.finished
    ? [
      goal.description.split('\\n').join('\n'),
      `${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE}**Completed!**${Const.EMOJIS.WHITESPACE}${Const.EMOJIS.WHITESPACE} ** ${goal.current}/${goal.cost}**`
    ] : [
      goal.description.split('\\n').join('\n'),
      reachedText || '',
      Const.EMOJIS.WHITESPACE + ' ' + generateProgressBar(goal.current / goal.cost, 7) + Const.EMOJIS.WHITESPACE + ` ** ${goal.current}/${goal.cost}**`,
      recentsText || '',
      `*${project.display.token_icon_one} contribute 1 ${project.display.token_name_one} ${Const.EMOJIS.WHITESPACE} ${project.display.token_icon_multiple} contribute 5 ${project.display.token_name_multiple}*`
    ]
  /* eslint-enable multiline-ternary */
  /* eslint-enable indent */

  return {
    title: goal.title,
    description: description.join('\n'),
    color: goal.finished
      ? 0x68B2E3
      : reached
        ? 0x45B583
        : 0x1F2324
  }
}
