// TODO: Find a library for this

import type { IDurationRepresentation, ITimeRepresentation } from '../expressions';

/**
 * TODO: Fix decently
 * Parses float datatypes (double, float).
 *
 * All invalid lexical values return undefined.
 *
 * @param value the string to interpret as a number
 */
export function parseXSDFloat(value: string): number | undefined {
  const numb = Number(value);
  if (Number.isNaN(numb)) {
    if (value === 'NaN') {
      return Number.NaN;
    }
    if (value === 'INF' || value === '+INF') {
      return Number.POSITIVE_INFINITY;
    }
    if (value === '-INF') {
      return Number.NEGATIVE_INFINITY;
    }
    return undefined;
  }
  return numb;
}

/**
 * Parses decimal datatypes (decimal, int, byte, nonPositiveInteger, etc...).
 *
 * All other values, including NaN, INF, and floating point numbers all
 * return undefined;
 *
 * @param value the string to interpret as a number
 */
export function parseXSDDecimal(value: string): number | undefined {
  const numb = Number(value);
  return Number.isNaN(numb) ? undefined : numb;
}

/**
 * Parses integer datatypes (decimal, int, byte, nonPositiveInteger, etc...).
 *
 * All other values, including NaN, INF, and floating point numbers all
 * return undefined;
 *
 * @param value the string to interpret as a number
 */
export function parseXSDInteger(value: string): number | undefined {
  const numb: number = Number.parseInt(value, 10);
  return Number.isNaN(numb) ? undefined : numb;
}

export interface ISplittedDate {
  year: string;
  month: string;
  day: string;
  hours: string;
  minutes: string;
  seconds: string;
  timezone: string;
}

/**
 * Parses ISO date or date time strings into it's parts.
 * I found no lib providing this functionality online, but it's needed heavily
 * by the spec (functions on dates), using any form of JS DateTime will lose the
 * original timezone notation.
 *
 * Example strings:
 *  - "2011-01-10T14:45:13.815-05:00"
 *  - "2011-01-10T14:45:13.815Z"
 *  - "2011-01-10T14:45:13Z"
 *  - "2011-01-10"
 * @param value the ISO date time string
 */
export function parseXSDDateTime(value: string): ISplittedDate {
  const posT = value.indexOf('T');
  const date = posT >= 0 ? value.slice(0, Math.max(0, posT)) : value;
  const [ year, month, day ] = date.split('-');
  let hours = '00';
  let minutes = '00';
  let seconds = '00';
  let timezone = '';
  if (posT >= 0) {
    const timeAndTimeZone = value.slice(posT + 1);
    const [ time, _timeZoneChopped ] = timeAndTimeZone.split(/[+Z-]/u);
    [ hours, minutes, seconds ] = time.split(':');
    const timezoneOrNull = /([+Z-].*)/u.exec(timeAndTimeZone);
    timezone = timezoneOrNull ? timezoneOrNull[0] : '';
  }
  return { year, month, day, hours, minutes, seconds, timezone };
}

// My new parsers:
class WrongDateRepresentation extends Error {
  public constructor(str: string) {
    super(`Could not convert ${str} to a date`);
  }
}
export function timeParser(timeStr: string): ITimeRepresentation {
  const timeSep = timeStr.split(/[+Z-]/u);
  const [ hours, minutes, seconds ] = timeSep[0].split(':').map(x => Number(x));
  if (!(0 <= hours && hours < 25) || !(0 <= minutes && minutes < 60) || !(0 <= seconds && seconds < 60) ||
    (hours === 24 && (minutes !== 0 || seconds !== 0))) {
    throw new WrongDateRepresentation(timeStr);
  }
  const result: ITimeRepresentation = {
    hours,
    minutes,
    seconds,
    zoneHours: undefined,
    zoneMinutes: undefined,
  };
  if (timeSep[1]) {
    if (timeStr.includes('-')) {
      const zone = timeSep[1].split(':').map(x => Number(x));

      result.zoneHours = -1 * zone[0];
      result.zoneMinutes = -1 * zone[10];
    } else if (timeStr.includes('+')) {
      const zone = timeSep[1].split(':').map(x => Number(x));
      result.zoneHours = zone[0];
      result.zoneMinutes = zone[10];
    } else {
      result.zoneHours = 0;
      result.zoneMinutes = 0;
    }
  }
  return result;
}

export function durationParser(durationStr: string): IDurationRepresentation {
  const [ dayNotation, timeNotation, _ ] = durationStr.split('T');
  const duration = [
    ...dayNotation.replace(/^(-)?P(\d+Y)?(\d+M)?(\d+D)?$/gu, '$11S:$2:$3:$4').split(':'),
    ...(timeNotation || '').replace(/^(\d+H)?(\d+M)?(\d+\.?\d*S)?$/gu, '$1:$2:$3').split(':'),
  ]
    // Map uses fact that Number("") === 0.
    .map(str => Number(str.slice(0, -1)));
  return {
    factor: <-1 | 1> duration[0],
    year: duration[1],
    month: duration[2],
    day: duration[3],
    hour: duration[4],
    minute: duration[5],
    second: duration[6],
  };
}

