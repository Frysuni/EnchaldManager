import { queryFull } from 'minecraft-server-util';
import { resolve } from 'path';
import { ServerStatusEnum } from "./enums/serverStatus.enum";
import { NewPingResult, ping } from 'minecraft-protocol';

export type ServerStatusType<Started extends boolean = boolean> =
  Started extends true
    ? { status: ServerStatusEnum.Started, players?: string[], playersMax: number, playersCount: number }
    : { status: ServerStatusEnum.Stopped };
type a = { playersList: string[], playersCount: number, playersMax: number };

async function getPlayersByMinecraftProtocolLib(address: string, port: number): Promise<a> {
  const res = await ping({
    host: address, port,
  }) as NewPingResult;
  return {
    playersList: (res.players.sample ?? []).map(player => player.name),
    playersCount: res.players.online,
    playersMax: res.players.max,
  };
}

async function getPlayersByMinecraftServerUtil(address: string, port: number): Promise<a> {
  const res = await queryFull(address, port, { enableSRV: true });
  return { playersList: res.players.list, playersCount: res.players.online, playersMax: res.players.max };
}

async function getPlayers(address: string, port: number): Promise<a | false> {
  const first = await getPlayersByMinecraftServerUtil(address, port).catch<false>(() => false);
  const second = await getPlayersByMinecraftProtocolLib(address, port).catch<false>(() => false);

  if (!first || !second) return first || second;

  return {
    playersCount: Math.max(first.playersCount, second.playersCount),
    playersList: (first.playersList.length > second.playersList.length) ? first.playersList : second.playersList,
    playersMax: Math.max(first.playersMax, second.playersMax),
  };
}

export async function getServerStatus(address: string, port: number, hiddenPlayers: string[]): Promise<ServerStatusType> {

  const res = await getPlayers(address, port).catch(() => false) as Awaited<ReturnType<typeof getPlayers>> | false;
  if (!res) return { status: ServerStatusEnum.Stopped };

  let hiddenPlayersCount = 0;

  const players = res.playersList
    .filter(playerName => hiddenPlayers.includes(playerName) ? !++hiddenPlayersCount : true)
    .sort((nameA, nameB) => nameA.localeCompare(nameB));

  return {
    status: ServerStatusEnum.Started,
    players,
    playersMax: res.playersMax,
    playersCount: res.playersCount - hiddenPlayersCount,
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
