import { Product, Project } from 'types'
import Const from '../const'


export function generateStoreWidget(project: Project, recents: string[]) {
  let recentsText = recents.slice(0, 5).join('\n')

  recentsText = `\n\n${recents.join('\n')}`
  if (recents.length > 5)
    recentsText += `\n*+${recents.length - 5} more...*`

  const text = project.texts.store_info
    + '\n\n'
    + project.store.products
      .map(p => beautifyProduct(p, project))
      .join('\n\n')
    + recentsText

  return {
    embed: {
      color: 0xE3544E,
      thumbnail: {
        url: 'https://cdn.discordapp.com/emojis/818836880476995614.png?v=1' // TODO make dynamic
      },
      fields: [
        {
          name: 'Store',
          value: text
        }
      ]
    }
  }
}

function beautifyProduct(product: Product, project: Project) {
  if (product.type === 'role')
    return `${product.emoji} **Role <@&${product.id}> for ${product.price} ${project.display.token_icon_multiple}**\n${Const.EMOJIS.WHITESPACE} ${product.description}`

  return `${product.emoji} ${product.name} for ${product.price} ${project.display.token_icon_multiple}\n${Const.EMOJIS.WHITESPACE} ${product.description}`
}
