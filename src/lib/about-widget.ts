import { Project } from 'types'


export function generateAboutWidget(project: Project) {
  return {
    embed: {
      color: 0xEACC60,
      thumbnail: {
        url: 'https://cdn.discordapp.com/emojis/793172861673275473.png?v=1' // TODO make dynamic
      },
      fields: [
        {
          name: 'What is this?',
          value: project.texts.info
        },
        {
          name: `And how do I get ${project.display.token_name_multiple}?`,
          value: project.texts.get_tokens
        }
      ]
    }
  }
}
