import type {
  IDateRepresentation, IDateTimeRepresentation, IDayTimeDurationRepresentation,
  IDurationRepresentation,
  ITimeRepresentation,
  ITimeZoneRepresentation, IYearMonthDurationRepresentation,
} from './InternalRepresentations';
import { extractDayTimeDur } from './InternalRepresentations';
import { maximumDayInMonthFor } from './specAlgos';

function numSer(num: number, min = 2): string {
  return num.toLocaleString(undefined, { minimumIntegerDigits: min, useGrouping: false });
}

// Parsers:
export function dateTimeParser(dateTimeStr: string, errorCreator?: () => Error): IDateTimeRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#dateTime
  const [ date, time ] = dateTimeStr.split('T');
  return { ...dateParser(date, errorCreator), ...internalTimeParser(time, errorCreator) };
}

export function dateTimeSerializer(date: IDateTimeRepresentation): string {
  // Need to extract the date because we don't want the timeZone part here
  return `${dateSerializer({ year: date.year, month: date.month, day: date.day })}T${timeSerializer(date)}`;
}

function timeZoneParser(timeZoneStr: string, errorCreator?: () => Error): Partial<ITimeZoneRepresentation> {
  // https://www.w3.org/TR/xmlschema-2/#dateTime-timezones
  if (timeZoneStr === '') {
    return { zoneHours: undefined, zoneMinutes: undefined };
  }
  if (timeZoneStr === 'Z') {
    return { zoneHours: 0, zoneMinutes: 0 };
  }
  const timeZoneStrings = timeZoneStr.replace(/^([+|-])(\d\d):(\d\d)$/gu, '$11!$2!$3').split('!');
  const timeZone = timeZoneStrings.map(str => Number(str));
  return {
    zoneHours: timeZone[0] * timeZone[1],
    zoneMinutes: timeZone[0] * timeZone[2],
  };
}

function timeZoneSerializer(tz: Partial<ITimeZoneRepresentation>): string {
  if (tz.zoneHours === undefined || tz.zoneMinutes === undefined) {
    return '';
  }
  if (tz.zoneHours === 0 && tz.zoneMinutes === 0) {
    return 'Z';
  }
  return `${tz.zoneHours >= 0 ? `+${numSer(tz.zoneHours)}` : numSer(tz.zoneHours)}:${numSer(Math.abs(tz.zoneMinutes))}`;
}

export function dateParser(dateStr: string, errorCreator?: () => Error): IDateRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#date-lexical-representation
  const formatted = dateStr.replace(
    /^(-)?([123456789]*\d{4})-(\d\d)-(\d\d)(Z|([+-]\d\d:\d\d))?$/gu, '$11!$2!$3!$4!$5',
  );
  if (formatted === dateStr) {
    throw new Error('nono');
  }
  const dateStrings = formatted.split('!');
  const date = dateStrings.slice(0, -1).map(str => Number(str));

  const res = {
    year: date[0] * date[1],
    month: date[2],
    day: date[3],
    ...timeZoneParser(dateStrings[4]),
  };
  if (!(1 <= res.month && res.month <= 12) || !(1 <= res.day && res.day <= maximumDayInMonthFor(res.year, res.month))) {
    throw new Error('nono');
  }
  return res;
}

export function rawTimeZoneExtractor(zoneContained: string): string {
  const extraction = /(Z|([+-]\d\d:\d\d))?$/u.exec(zoneContained);
  // It is safe to cast here because the empty string can always match.
  return extraction![0];
}

export function dateSerializer(date: IDateRepresentation): string {
  return `${numSer(date.year, 4)}-${numSer(date.month)}-${numSer(date.day)}${timeZoneSerializer(date)}`;
}

function internalTimeParser(timeStr: string, errorCreator?: () => Error): ITimeRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#time-lexical-repr
  const formatted = timeStr.replace(/^(\d\d):(\d\d):(\d\d(\.\d+)?)(Z|([+-]\d\d:\d\d))?$/gu, '$1!$2!$3!$5');
  if (formatted === timeStr) {
    throw new Error('Invalid time');
  }
  const timeStrings = formatted.split('!');
  const time = timeStrings.slice(0, -1).map(str => Number(str));

  const res = {
    hours: time[0],
    minutes: time[1],
    seconds: time[2],
    ...timeZoneParser(timeStrings[3]),
  };

  if (res.seconds >= 60 || res.minutes >= 60 || res.hours > 24 ||
    (res.hours === 24 && (res.minutes !== 0 || res.seconds !== 0))) {
    throw new Error('nono');
  }
  return res;
}

export function timeParser(timeStr: string, errorCreator?: () => Error): ITimeRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#time-lexical-repr
  const res = internalTimeParser(timeStr, errorCreator);
  res.hours %= 24;
  return res;
}

export function timeSerializer(time: ITimeRepresentation): string {
  return `${numSer(time.hours)}:${numSer(time.minutes)}:${numSer(time.seconds)}${timeZoneSerializer(time)}`;
}

export function durationParser(durationStr: string): Partial<IDurationRepresentation> {
  // https://www.w3.org/TR/xmlschema-2/#duration-lexical-repr
  const [ dayNotation, timeNotation ] = durationStr.split('T');

  // Handle date part
  const formattedDayDur = dayNotation.replace(/^(-)?P(\d+Y)?(\d+M)?(\d+D)?$/gu, '$11S!$2!$3!$4');
  if (formattedDayDur === dayNotation) {
    throw new Error('nono');
  }

  const durationStrings = formattedDayDur.split('!');
  if (timeNotation !== undefined) {
    const formattedTimeDur = timeNotation.replace(/^(\d+H)?(\d+M)?(\d+(\.\d+)?S)?$/gu, '$1!$2!$3');

    if (timeNotation === '' || timeNotation === formattedTimeDur) {
      throw new Error('nono');
    }
    durationStrings.push(...formattedTimeDur.split('!'));
  }
  const duration = durationStrings.map(str => str.slice(0, -1));
  if (!duration.slice(1).some(item => item)) {
    throw new Error('nono');
  }

  const sign = <-1 | 1> Number(duration[0]);
  return {
    year: duration[1] ? sign * Number(duration[1]) : undefined,
    month: duration[2] ? sign * Number(duration[2]) : undefined,
    day: duration[3] ? sign * Number(duration[3]) : undefined,
    hours: duration[4] ? sign * Number(duration[4]) : undefined,
    minutes: duration[5] ? sign * Number(duration[5]) : undefined,
    seconds: duration[6] ? sign * Number(duration[6]) : undefined,
  };
}

export function yearMonthDurationParser(durationStr: string): Partial<IYearMonthDurationRepresentation> {
  const res = durationParser(durationStr);
  if (Object.entries(res).some(([ key, value ]) => value !== undefined && ![ 'year', 'month' ].includes(key))) {
    throw new Error('nono');
  }
  return res;
}

export function dayTimeDurationParser(durationStr: string): Partial<IDayTimeDurationRepresentation> {
  const res = durationParser(durationStr);
  const filtered = extractDayTimeDur(res);
  if (Object.entries(res).some(([ key, value ]) => value !== undefined && ![
    'hours',
    'minutes',
    'seconds',
    'day',
  ].includes(key))) {
    throw new Error('nono');
  }
  return res;
}

export function durationSerializer(dur: Partial<IDurationRepresentation>, zeroString: 'PT0S' | 'P0M' = 'PT0S'): string {
  if (!Object.values(dur).some(val => (val || 0) !== 0)) {
    return zeroString;
  }
  const negative: boolean = Object.values(dur).some(val => (val || 0) < 0);
  const hasTimeField = !!(dur.hours || dur.minutes || dur.seconds);
  return `${negative ? '-' : ''}P${dur.year ? `${Math.abs(dur.year)}Y` : ''}${dur.month ?
    `${Math.abs(dur.month)}M` :
    ''}${dur.day ?
    `${Math.abs(dur.day)}D` :
    ''}${hasTimeField ?
    `T${dur.hours ? `${Math.abs(dur.hours)}H` : ''}${dur.minutes ?
      `${Math.abs(dur.minutes)}M` :
      ''}${dur.seconds ? `${Math.abs(dur.seconds)}S` : ''}` :
    ''}`;
}
