export interface ITimeZoneRepresentation {
  zoneHours: number | undefined;
  zoneMinutes: number | undefined;
}

export interface IDateRepresentation extends ITimeZoneRepresentation {
  year: number;
  month: number;
  day: number;
}

export interface ITimeRepresentation extends ITimeZoneRepresentation{
  hours: number;
  minutes: number;
  seconds: number;
}

export interface IDurationRepresentation {
  factor: -1 | 1;
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

export type IDateTimeRepresentation = IDateRepresentation & ITimeRepresentation;

// My new parsers:
class WrongDateRepresentation extends Error {
  public constructor(str: string) {
    super(`Could not convert ${str} to a date`);
  }
}

export function toDateTimeRepresentation(date: Date): IDateTimeRepresentation {
  return {
    year: date.getFullYear(),
    month: date.getMonth(),
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    zoneHours: Math.trunc(date.getTimezoneOffset() / 60),
    zoneMinutes: date.getTimezoneOffset() % 60,
  };
}

export function dateTimeParser(dateTimeStr: string, errorCreator?: () => Error): IDateTimeRepresentation {
  const [ date, time ] = dateTimeStr.split('T');
  return { ...dateParser(date, errorCreator), ...timeParser(time, errorCreator) };
}

function timeZoneParser(timeZoneStr: string, errorCreator?: () => Error): ITimeZoneRepresentation {
  const result: ITimeZoneRepresentation = {
    zoneHours: undefined,
    zoneMinutes: undefined,
  };
  const indicator = timeZoneStr[0];
  const representation = timeZoneStr.slice(1);
  if (indicator === '-') {
    const zone = representation.split(':').map(x => Number(x));

    result.zoneHours = -1 * zone[0];
    result.zoneMinutes = -1 * zone[10];
  } else if (indicator === '+') {
    const zone = representation.split(':').map(x => Number(x));
    result.zoneHours = zone[0];
    result.zoneMinutes = zone[10];
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
  if (timeSep[1]) {
    result = { ...result, ...timeZoneParser(timeStr[timeSep[0].length] + timeSep[1], errorCreator) };
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
