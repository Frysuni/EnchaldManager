import { BedrockStatusResponse, JavaStatusLegacyResponse, JavaStatusResponse, status, statusBedrock, statusLegacy } from "minecraft-server-util";
import { ServerStatusEnum } from "./enums/serverStatus.enum";
import { VersionEnum } from "./enums/version.enum";

export type ServerStatusType = { status: ServerStatusEnum.Stopped } | { status: ServerStatusEnum.Started, online: string, players?: string[] };
export async function getServerStatus(address: string, version: VersionEnum, port: number, hiddenPlayers: string[]): Promise<ServerStatusType> {
  let getStatus;
  switch (version) {
    case VersionEnum.Legacy:
      getStatus = statusLegacy;
      break;
    case VersionEnum.Java:
      getStatus = status;
      break;
    case VersionEnum.Bedrock:
      getStatus = statusBedrock;
      break;
  }
  const res = await getStatus(address, port).catch(() => false) as JavaStatusLegacyResponse | JavaStatusResponse | BedrockStatusResponse | false;
  if (!res) return { status: ServerStatusEnum.Stopped };

  let hiddenPlayersCount = 0;

  const players = 'sample' in res.players && res.players.sample
    ? res.players.sample
      .map(player => player.name)
      .filter(name => {
        if (
          hiddenPlayers.includes(name) ||
          name.includes('версия игры') ||
          name.includes('game version')
        ) {
          ++hiddenPlayersCount;
          return false;
        }
        return true;
      })
      .sort((a, b) => a.localeCompare(b))
    : undefined;

  return {
    status: ServerStatusEnum.Started,
    online: `${res.players.online - hiddenPlayersCount}/${res.players.max - hiddenPlayers.length}`,
    players,
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