function parseAndDivideAndLimitPlayers(rawPlayers?: string[]): [string[], string[], string[]] {
  const parsePlayerName = (name: string): string => `• ${name.replace(/_/g, '\\_').replace(/\*/g, '\\*').replace(/~/g, '\\~').replace(/`/g, '\\`')}\n`;
  rawPlayers = rawPlayers?.map(parsePlayerName) ?? [];

  const embedValueLimit = 70;

  let wasCutOff = 0;
  const limit = (rawPlayers: string[]): string[] => {
    let totalLength = 0;
    const limitedPlayers: string[] = [];

    for (const player of rawPlayers) {
      totalLength += player.length;
      if (totalLength > embedValueLimit - '...NNN ещё'.length) {
        wasCutOff += rawPlayers.length - limitedPlayers.length;
        break;
      }
      limitedPlayers.push(player);
    }

    return limitedPlayers;
  };

  const third = Math.round(rawPlayers.length / 3);
  const firstThird  = limit(rawPlayers.slice(0, third));
  const secondThird = limit(rawPlayers.slice(third, 2 * third));
  const lastThird   = limit(rawPlayers.slice(2 * third));

  if (firstThird.length == 0 && lastThird.length > 0) firstThird[0] = lastThird.shift() as string;
  if (wasCutOff > 0) firstThird.push(`...${wasCutOff} ещё`);

  return [
    firstThird,
    secondThird,
    lastThird,
  ];
}

const players: string[] = [];

for (let i = 0; i < 123012; i++) {
  players.push(Math.random().toString(36).substring(2))
}

const res = parseAndDivideAndLimitPlayers(players);

console.log(res);
console.log(res[0].join('').length)
console.log(res[1].join('').length)
console.log(res[2].join('').length)