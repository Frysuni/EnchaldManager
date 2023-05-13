import { status, statusLegacy, statusBedrock, JavaStatusLegacyResponse, JavaStatusResponse, BedrockStatusResponse } from "minecraft-server-util";
import { async } from "rxjs";
import { ServerStatusEnum } from "./enums/serverStatus.enum";
import { VersionEnum } from "./enums/version.enum";

export function divideArray<T extends string>(array?: T[]): [T[], T[]] {
  array = array ?? [];

  const middleIndex = Math.floor(array.length / 2);
  const firstHalf   = array.slice(0, middleIndex);
  const secondHalf  = array.slice(middleIndex);

  return [secondHalf, firstHalf];
}

export function parseRestartTime(restartTime: string) {
  const now = Date.now();
  const [hours, minutes] = restartTime.split(':');

  let restartAt = new Date().setHours(Number(hours), Number(minutes), 0, 0);
  restartAt = restartAt <= now ? restartAt + 24 * 60 * 60 * 1000 : restartAt;

  const restartIn = restartAt - now

  return {
    restartAt,
    restartAtInSeconds: ~~(restartAt / 1000),
    restartIn,
  }
}

export function parseBackupTime(backupTime: string) {
  console.log('Hi parser!');
  const daysOfWeek = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
  const [startRaw, endRaw] = backupTime.split('-');
  console.log('startRaw:', startRaw);
  console.log('endRaw:', endRaw);
  const times = {
    start: {
      dayOfWeek: daysOfWeek.indexOf(startRaw.substring(0, 3)),
      hours: Number(startRaw.substring(4, 6)),
      minutes: Number(startRaw.substring(7, 9)),
    },
    end: {
      dayOfWeek: daysOfWeek.indexOf(endRaw.substring(0, 3)),
      hours: Number(endRaw.substring(4, 6)),
      minutes: Number(endRaw.substring(7, 9)),
    },
  };
  console.log('times', times);
  const nowDate = new Date();
  console.log('nowDateDayOfWeek', nowDate.getDay())
  const startsAtDate = new Date(nowDate);
  startsAtDate.setDate(nowDate.getDate() + ((times.start.dayOfWeek + 7 - nowDate.getDay() - 1) % 7 + 1));
  startsAtDate.setHours(times.start.hours, times.start.minutes, 0, 0);
  
  const endsAtDate = new Date(nowDate);
  endsAtDate.setDate(nowDate.getDate() + ((times.end.dayOfWeek + 7 - nowDate.getDay() - 1) % 7 + 1));
  endsAtDate.setHours(times.end.hours, times.end.minutes, 0, 0);

  console.log('startsAtDate:', startsAtDate);
  console.log('endsAtDate:', endsAtDate);
  console.log('nowDate:', nowDate);

  console.log('endsAtDate.getTime() <= nowDate.getTime()', endsAtDate.getTime() <= nowDate.getTime())

  if (endsAtDate.getTime() <= nowDate.getTime()) {
    startsAtDate.setDate(startsAtDate.getDate() + 7);
    endsAtDate  .setDate(endsAtDate  .getDate() + 7);
  }

  const backupInProgress = startsAtDate.getTime() < nowDate.getTime();
  const backupStartsIn   = startsAtDate.getTime() - nowDate.getTime();
  const backupStopsIn    = endsAtDate  .getTime() - nowDate.getTime();

  console.log('backupInProgress', backupInProgress);
  console.log('backupStartsIn', backupStartsIn);
  console.log('backupStopsIn', backupStopsIn);

  return {
    backupInProgress,
    backupStartsIn,
    backupStopsIn,
  }
}

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

  // That's bruh lol // const players = 'sample' in res.players ? res.players.sample?.map(player => player.name).filter(name => (hiddenPlayers.includes(name) || name.includes('версия игры') || name.includes('game version')) ? !++hiddenPlayersCount : true).sort((a, b) => a.localeCompare(b)) : undefined;

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