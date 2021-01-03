

const emojis = {
  LEFT_EMPTY: '<:xpbarleftempty:654357985845575716>',
  LEFT_HALF: '<:xpbarlefthalf:654353598301339668>',
  LEFT_FULL: '<:xpbarleftfull:654353598603460609>',
  MIDDLE_EMPTY: '<:xpbarmiddleempty:654353598087430174>',
  MIDDLE_1: '<:xpbarmiddle1:654353598288887840>',
  MIDDLE_2: '<:xpbarmiddle2:654353598230167574>',
  MIDDLE_3: '<:xpbarmiddle3:654353597819256843>',
  RIGHT_EMPTY: '<:xpbarrightempty:654353598263853066>',
  RIGHT_HALF: '<:xpbarrighthalf:654353597999611908>',
  RIGHT_FULL: '<:xpbarrightfull:654353598204870656>'
}


export function generateProgressBar(progress: number, slots: number): string {
  slots *= 2
  let xpbar = ''
  const prog12 = Math.floor(progress * slots)
  if (prog12 === 0) xpbar += emojis.LEFT_EMPTY
  else if (prog12 === 1) xpbar += emojis.LEFT_HALF
  else xpbar += emojis.LEFT_FULL
  for (let i = 1; i <= slots / 2 - 2; i++) {
    const relative = prog12 - i * 2
    if (relative < 0) xpbar += emojis.MIDDLE_EMPTY
    else if (relative === 0) xpbar += emojis.MIDDLE_1
    else if (relative === 1) xpbar += emojis.MIDDLE_2
    else xpbar += emojis.MIDDLE_3
  }
  if (prog12 >= slots - 1) xpbar += emojis.RIGHT_FULL
  else if (prog12 === slots - 2) xpbar += emojis.RIGHT_HALF
  else xpbar += emojis.RIGHT_EMPTY
  return xpbar
}
