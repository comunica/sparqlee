import * as lux from 'luxon';

export interface ITimeZoneRepresentation {
  zoneHours: number;
  zoneMinutes: number;
}

export interface IDateRepresentation extends Partial<ITimeZoneRepresentation> {
  year: number;
  month: number;
  day: number;
}

export interface ITimeRepresentation extends Partial<ITimeZoneRepresentation>{
  hours: number;
  minutes: number;
  seconds: number;
}

export interface ICompleteDayTimeDurationRepresentation {
  hours: number;
  minutes: number;
  seconds: number;
  day: number;
}
export type IDayTimeDurationRepresentation = Partial<ICompleteDayTimeDurationRepresentation>;
export function getCompleteDayTimeDurationRepresentation(rep: IDayTimeDurationRepresentation):
ICompleteDayTimeDurationRepresentation {
  return {
    day: rep.day || 0,
    hours: rep.hours || 0,
    minutes: rep.minutes || 0,
    seconds: rep.seconds || 0,
  };
}

export function getCompleteDurationRepresentation(rep: IDurationRepresentation): ICompleteDurationRepresentation {
  return {
    ...getCompleteDayTimeDurationRepresentation(rep),
    month: rep.month || 0,
    year: rep.year || 0,
  };
}

export interface ICompleteYearMonthDuration {
  year: number;
  month: number;
}

export type IYearMonthDuration = Partial<ICompleteYearMonthDuration>;

export type IDurationRepresentation = IYearMonthDuration & IDayTimeDurationRepresentation;
export type ICompleteDurationRepresentation = ICompleteYearMonthDuration & ICompleteDayTimeDurationRepresentation;
export type IDateTimeRepresentation = IDateRepresentation & ITimeRepresentation;

// Interface used internally for dates. JS dates are UTC, all you can do is ask your system offset.
export interface IInternalJSDate {
  date: Date;
  timeZone: ITimeZoneRepresentation;
}

// My new parsers:
class WrongDateRepresentation extends Error {
  public constructor(str: string) {
    super(`Could not convert ${str} to a date`);
  }
}

export function toDateTimeRepresentation({ date, timeZone }: IInternalJSDate): IDateTimeRepresentation {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    zoneHours: timeZone.zoneHours,
    zoneMinutes: timeZone.zoneMinutes,
  };
}

export function toUTCDate(date: IDateTimeRepresentation, defaultTimezone: ITimeZoneRepresentation): Date {
  // The given hours will be assumed to be local time.
  const localTime = new Date(date.year, date.month, date.day, date.hours, date.minutes, date.seconds);
  // This date has been constructed in machine local time, now we alter it to become UTC and convert to correct timezone
  return new Date(
    localTime.getTime() + (localTime.getTimezoneOffset() - (date.zoneHours || defaultTimezone.zoneHours) * 60 -
      (date.zoneMinutes || defaultTimezone.zoneMinutes)) * 60 * 1_000,
  );
}

export function durationToMillies(dur: IDurationRepresentation): number {
  const year = dur.year || 0;
  const date = new Date(year, dur.month || 0, (dur.day || 0) + 1, dur.hours || 0, dur.minutes || 0, Math.trunc(dur.seconds || 0), ((dur.seconds || 0) % 1) * 1_000);
  if (0 <= year && year < 100) {
    // Special rule of date has gone int action.
    // We do not use the year variable since there might have been another year if the months were high.
    const jumpDeltaOfDate = 1_900;
    date.setFullYear(date.getFullYear() - jumpDeltaOfDate);
  }
  return date.getTime();
}

// Parsers:

export function dateTimeParser(dateTimeStr: string, errorCreator?: () => Error): IDateTimeRepresentation {
  const [ date, time ] = dateTimeStr.split('T');
  return { ...dateParser(date, errorCreator), ...timeParser(time, errorCreator) };
}

function timeZoneParser(timeZoneStr: string, errorCreator?: () => Error): Partial<ITimeZoneRepresentation> {
  const result: Partial<ITimeZoneRepresentation> = {
    zoneHours: undefined,
    zoneMinutes: undefined,
  };
  const indicator = timeZoneStr[0];
  const representation = timeZoneStr.slice(1);
  if (indicator === '-') {
    const zone = representation.split(':').map(x => Number(x));

    result.zoneHours = -1 * zone[0];
    result.zoneMinutes = zone[1];
  } else if (indicator === '+') {
    const zone = representation.split(':').map(x => Number(x));
    result.zoneHours = zone[0];
    result.zoneMinutes = zone[1];
  } else {
    result.zoneHours = 0;
    result.zoneMinutes = 0;
  }
  return result;
}

export function dateParser(dateStr: string, errorCreator?: () => Error): IDateRepresentation {
  // Ugly function, I know, there are just a lot of cases.
  // Note that -0045-01-01 is a valid date. - But the year 0000 is not valid
  const splittedDate = dateStr.split('-');
  const negativeYear = splittedDate[0] === '' ? 1 : 0;
  const year = Number(splittedDate[0 + negativeYear]);
  const month = Number(splittedDate[1 + negativeYear]);

  const dayAndPotentiallyTimeZone = splittedDate[2 + negativeYear];
  const [ dayStr, timeZone ] = dayAndPotentiallyTimeZone.split(/[+Z]/u);
  const day = Number(dayStr);

  let result: IDateRepresentation = {
    day,
    month,
    // Arithmetic to give the right sign
    year: year * (negativeYear * -2 + 1),
    zoneHours: undefined,
    zoneMinutes: undefined,
  };

  const potentialNegativeZone: string | undefined = splittedDate[3 + negativeYear];
  if (potentialNegativeZone) {
    result = { ...result, ...timeZoneParser(`-${potentialNegativeZone}`, errorCreator) };
  } else if (timeZone) {
    result = { ...result, ...timeZoneParser(dayAndPotentiallyTimeZone[dayStr.length] + timeZone, errorCreator) };
  }
  return result;
}

export function timeParser(timeStr: string, errorCreator?: () => Error): ITimeRepresentation {
  const timeSep = timeStr.split(/[+Z-]/u);
  const [ hours, minutes, seconds ] = timeSep[0].split(':').map(x => Number(x));
  if (!(0 <= hours && hours < 25) || !(0 <= minutes && minutes < 60) || !(0 <= seconds && seconds < 60) ||
    (hours === 24 && (minutes !== 0 || seconds !== 0))) {
    throw new WrongDateRepresentation(timeStr);
  }
  let result: ITimeRepresentation = {
    hours,
    minutes,
    seconds,
    zoneHours: undefined,
    zoneMinutes: undefined,
  };
  if (timeSep[1] !== undefined) {
    result = { ...result, ...timeZoneParser(timeStr[timeSep[0].length] + timeSep[1], errorCreator) };
  }
  return result;
}

export function durationParser(durationStr: string): ICompleteDurationRepresentation {
  const [ dayNotation, timeNotation, _ ] = durationStr.split('T');
  const durationStrings = [
    ...dayNotation.replace(/^(-)?P(\d+Y)?(\d+M)?(\d+D)?$/gu, '$11S:$2:$3:$4').split(':'),
    ...(timeNotation || '').replace(/^(\d+H)?(\d+M)?(\d+\.?\d*S)?$/gu, '$1:$2:$3').split(':'),
  ];
  // Map uses fact that Number("") === 0.
  const duration = durationStrings.map(str => Number(str.slice(0, -1)));
  const factor = <-1 | 1> duration[0];
  // The factor should be with the first non 0 element
  for (let i = 1; i < duration.length; i++) {
    duration[i] *= factor;
    if (duration[i] !== 0) {
      break;
    }
  }

  // If the date part is not provided, it is 1. But it needs to be after factor calculation.
  if (durationStrings[3] === '') {
    // TODO: might need to be 1
    duration[3] = 0;
  }
  return {
    year: duration[1],
    month: duration[2],
    day: duration[3],
    hours: duration[4],
    minutes: duration[5],
    seconds: duration[6],
  };
}
