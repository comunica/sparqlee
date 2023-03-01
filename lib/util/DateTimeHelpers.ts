import type {
  IDateRepresentation, IDateTimeRepresentation, IDayTimeDurationRepresentation,
  IDurationRepresentation,
  ITimeRepresentation,
  ITimeZoneRepresentation, IYearMonthDurationRepresentation,
} from './InternalRepresentations';
import { extractDayTimeDur } from './InternalRepresentations';
import { maximumDayInMonthFor } from './specAlgos';

function numSerializer(num: number, min = 2): string {
  return num.toLocaleString(undefined, { minimumIntegerDigits: min, useGrouping: false });
}

export function parseDateTime(dateTimeStr: string, errorCreator?: () => Error): IDateTimeRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#dateTime
  const [ date, time ] = dateTimeStr.split('T');
  return { ...parseDate(date, errorCreator), ...internalParseTime(time, errorCreator) };
}

export function serializeDateTime(date: IDateTimeRepresentation): string {
  // Extraction is needed because the date serializer can not add timezone y
  return `${sierializeDate({ year: date.year, month: date.month, day: date.day })}T${serializeTime(date)}`;
}

function parseTimeZone(timeZoneStr: string, errorCreator?: () => Error): Partial<ITimeZoneRepresentation> {
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

function serializeTimeZone(tz: Partial<ITimeZoneRepresentation>): string {
  if (tz.zoneHours === undefined || tz.zoneMinutes === undefined) {
    return '';
  }
  if (tz.zoneHours === 0 && tz.zoneMinutes === 0) {
    return 'Z';
  }
  return `${tz.zoneHours >= 0 ? `+${numSerializer(tz.zoneHours)}` : numSerializer(tz.zoneHours)}:${numSerializer(Math.abs(tz.zoneMinutes))}`;
}

export function parseDate(dateStr: string, errorCreator?: () => Error): IDateRepresentation {
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
    ...parseTimeZone(dateStrings[4]),
  };
  if (!(1 <= res.month && res.month <= 12) || !(1 <= res.day && res.day <= maximumDayInMonthFor(res.year, res.month))) {
    throw new Error('nono');
  }
  return res;
}

export function extractRawTimeZone(zoneContained: string): string {
  const extraction = /(Z|([+-]\d\d:\d\d))?$/u.exec(zoneContained);
  // It is safe to cast here because the empty string can always match.
  return extraction![0];
}

export function sierializeDate(date: IDateRepresentation): string {
  return `${numSerializer(date.year, 4)}-${numSerializer(date.month)}-${numSerializer(date.day)}${serializeTimeZone(date)}`;
}

function internalParseTime(timeStr: string, errorCreator?: () => Error): ITimeRepresentation {
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
    ...parseTimeZone(timeStrings[3]),
  };

  if (res.seconds >= 60 || res.minutes >= 60 || res.hours > 24 ||
    (res.hours === 24 && (res.minutes !== 0 || res.seconds !== 0))) {
    throw new Error('nono');
  }
  return res;
}

// We make a separation in internal and external since dateTime will have hour-date rollover,
// but time just does modulo the time.
export function parseTime(timeStr: string, errorCreator?: () => Error): ITimeRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#time-lexical-repr
  const res = internalParseTime(timeStr, errorCreator);
  res.hours %= 24;
  return res;
}

export function serializeTime(time: ITimeRepresentation): string {
  return `${numSerializer(time.hours)}:${numSerializer(time.minutes)}:${numSerializer(time.seconds)}${serializeTimeZone(time)}`;
}

export function parseDuration(durationStr: string): Partial<IDurationRepresentation> {
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

export function parseYearMonthDuration(durationStr: string): Partial<IYearMonthDurationRepresentation> {
  const res = parseDuration(durationStr);
  if (Object.entries(res).some(([ key, value ]) => value !== undefined && ![ 'year', 'month' ].includes(key))) {
    throw new Error('nono');
  }
  return res;
}

export function parseDayTimeDuration(durationStr: string): Partial<IDayTimeDurationRepresentation> {
  const res = parseDuration(durationStr);
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

export function serializeDuration(dur: Partial<IDurationRepresentation>, zeroString: 'PT0S' | 'P0M' = 'PT0S'): string {
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
