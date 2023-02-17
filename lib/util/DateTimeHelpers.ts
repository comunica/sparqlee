import type {
  IDateRepresentation, IDateTimeRepresentation,
  IDurationRepresentation,
  ITimeRepresentation,
  ITimeZoneRepresentation,
} from './InternalRepresentations';

// Parsers:

export function dateTimeParser(dateTimeStr: string, errorCreator?: () => Error): IDateTimeRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#dateTime
  const [ date, time ] = dateTimeStr.split('T');
  return { ...dateParser(date, errorCreator), ...timeParser(time, errorCreator) };
}

function timeZoneParser(timeZoneStr: string, errorCreator?: () => Error): Partial<ITimeZoneRepresentation> {
  // https://www.w3.org/TR/xmlschema-2/#dateTime-timezones
  if (timeZoneStr === '') {
    return { zoneHours: undefined, zoneMinutes: undefined };
  }
  if (timeZoneStr === 'Z') {
    return { zoneHours: 0, zoneMinutes: 0 };
  }
  const timeZoneStrings = timeZoneStr.replace(/^([+|-])(\d\d):(\d\d)$/gu, '$11:$2:$3').split(':');
  const timeZone = timeZoneStrings.map(str => Number(str));
  return {
    zoneHours: timeZone[0] * timeZone[1],
    zoneMinutes: timeZone[0] * timeZone[2],
  };
}

export function dateParser(dateStr: string, errorCreator?: () => Error): IDateRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#date-lexical-representation
  const dateStrings = dateStr.replace(
    /^(-)?([123456789]*\d{4})-(\d\d)-(\d\d)(Z|([+-]\d\d:\d\d))?$/gu, '$11:$2:$3:$4:$5',
  ).split(':');
  const date = dateStrings.slice(0, -1).map(str => Number(str));

  return {
    year: date[0] * date[1],
    month: date[2],
    day: date[3],
    ...timeZoneParser(dateStrings[4]),
  };
}

export function timeParser(timeStr: string, errorCreator?: () => Error): ITimeRepresentation {
  // https://www.w3.org/TR/xmlschema-2/#time-lexical-repr
  const timeStrings = timeStr.replace(/^(\d\d):(\d\d):(\d\d(\.\d+))(Z|([+-]\d\d:\d\d))?$/gu, '$1:$2:$3:$4').split(':');
  const time = timeStrings.slice(0, -1).map(str => Number(str));

  return {
    hours: time[0],
    minutes: time[1],
    seconds: time[2],
    ...timeZoneParser(timeStrings[5]),
  };
}

export function durationParser(durationStr: string): Partial<IDurationRepresentation> {
  // https://www.w3.org/TR/xmlschema-2/#duration-lexical-repr
  const [ dayNotation, timeNotation ] = durationStr.split('T');

  // Handle date part
  const durationStrings = dayNotation.replace(/^(-)?P(\d+Y)?(\d+M)?(\d+D)?$/gu, '$11S:$2:$3:$4').split(':');
  if (timeNotation !== undefined) {
    // TODO: Check if string is correct and throw error if not
    durationStrings.push(...timeNotation
      .replace(/^(\d+H)?(\d+M)?(\d+(\.\d+)?S)?$/gu, '$1:$2:$3').split(':'));
  }
  const duration = durationStrings.map(str => str.slice(0, -1));
  return {
    year: duration[1] ? Number(duration[1]) : undefined,
    month: duration[2] ? Number(duration[2]) : undefined,
    day: duration[3] ? Number(duration[3]) : undefined,
    hours: duration[4] ? Number(duration[4]) : undefined,
    minutes: duration[5] ? Number(duration[5]) : undefined,
    seconds: duration[6] ? Number(duration[6]) : undefined,
  };
}
