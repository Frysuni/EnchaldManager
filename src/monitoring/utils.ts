import { ping, PingOptions } from 'minecraft-protocol';
import { ServerStatusEnum } from "./enums/serverStatus.enum";

export type ServerStatusType<Started extends boolean = boolean> =
  Started extends true
    ? { status: ServerStatusEnum.Started, players?: string[], playersMax: number, playersCount: number }
    : { status: ServerStatusEnum.Stopped };

export async function getServerStatus(address: string, port: number, hiddenPlayers: string[]): Promise<ServerStatusType> {
  const options: PingOptions = {
    closeTimeout: 2000,
    noPongTimeout: 2000,
    host: address, port,
  };

  const res = await ping(options).catch(() => false) as Awaited<ReturnType<typeof ping>> | false;
  if (!res) return { status: ServerStatusEnum.Stopped };

  let hiddenPlayersCount = 0;

  const players = 'players' in res && res.players.sample
    ? res.players.sample
      .map(player => player.name)
      .filter(playerName => hiddenPlayers.includes(playerName) ? !++hiddenPlayersCount : true)
      .sort((nameA, nameB) => nameA.localeCompare(nameB))
    : undefined;

  const playersMax = 'players' in res
    ? res.players.max - hiddenPlayersCount
    : res.maxPlayers - hiddenPlayersCount;

  const playersCount = 'players' in res
    ? res.players.online - hiddenPlayersCount
    : res.playerCount - hiddenPlayersCount;

  return {
    status: ServerStatusEnum.Started,
    players,
    playersMax,
    playersCount,
  };
}

// Просто нереальна
export function parseAndDivideAndLimitPlayers(rawPlayers?: string[]): [string[], string[], string[]] {
  const parsePlayerName = (name: string): string => `• ${name.replace(/_/g, '\\_').replace(/\*/g, '\\*').replace(/~/g, '\\~').replace(/`/g, '\\`')}\n`;
  rawPlayers = rawPlayers?.map(parsePlayerName) ?? [];

  const embedValueLimit = 1024;

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

export function convertOffsetToMinutes(offset: string) {
  const [timezoneUtcOffsetHours, timezoneUtcOffsetMinutes] = offset.split(':').map(Number);
  const totalMinutes = timezoneUtcOffsetHours * 60 + timezoneUtcOffsetMinutes;
  return offset.startsWith('-') ? -totalMinutes : totalMinutes;
}

export function convertMinutesToOffset(minutes: number) {
  const absMinutes = Math.abs(minutes);

  const hours = Math.floor(absMinutes / 60);
  const mins = absMinutes % 60;

  const formattedHours = String(hours).padStart(2, '0');
  const formattedMins = String(mins).padStart(2, '0');

  const offset = (minutes < 0 ? '-' : '+') + formattedHours + ':' + formattedMins;

  return offset;
}