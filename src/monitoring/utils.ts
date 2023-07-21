import { queryFull } from 'minecraft-server-util';
import { resolve } from 'path';
import { ServerStatusEnum } from "./enums/serverStatus.enum";

export type ServerStatusType<Started extends boolean = boolean> =
  Started extends true
    ? { status: ServerStatusEnum.Started, players?: string[], playersMax: number, playersCount: number }
    : { status: ServerStatusEnum.Stopped };

export async function getServerStatus(address: string, port: number, hiddenPlayers: string[]): Promise<ServerStatusType> {

  const res = await queryFull(address, port, { enableSRV: true }).catch(() => false) as Awaited<ReturnType<typeof queryFull>> | false;
  if (!res) return { status: ServerStatusEnum.Stopped };

  let hiddenPlayersCount = 0;

  const players = res.players.list
    .filter(playerName => hiddenPlayers.includes(playerName) ? !++hiddenPlayersCount : true)
    .sort((nameA, nameB) => nameA.localeCompare(nameB));

  return {
    status: ServerStatusEnum.Started,
    players,
    playersMax: res.players.max - hiddenPlayers.length,
    playersCount: res.players.online - hiddenPlayersCount,
  };
}

// Просто нереальна
export function parseAndDivideAndLimitPlayers(rawPlayers?: string[]): [string[], string[]] {
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

  const half = Math.round(rawPlayers.length / 2);
  const firstHalf = limit(rawPlayers.slice(0, half));
  const secondHalf = limit(rawPlayers.slice(half));

  if (firstHalf.length === 0 && secondHalf.length > 0) firstHalf[0] = secondHalf.shift() as string;
  if (wasCutOff > 0) firstHalf.push(`...${wasCutOff} ещё`);

  return [
    firstHalf,
    secondHalf,
  ];
}

type RawTimezones = [{ n: string, o: number, u: string }];
type Timezone = { utcOffsetInMinutes: number, name: string, utcOffset: string };

export function getTimezone(offset: string | number): Timezone | undefined {
  const timezones = require(resolve(__dirname, '../', '../', 'timezones.json')) as RawTimezones;
  const timezone = timezones.find(timezone => timezone.o == offset || timezone.u == offset);
  return timezone
    ? { utcOffsetInMinutes: timezone.o, name: timezone.n, utcOffset: timezone.u }
    : undefined;
}
