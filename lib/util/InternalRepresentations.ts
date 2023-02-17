/**
 * We redefine some types here since the JS Date implementation is not sufficient.
 */
export interface ITimeZoneRepresentation {
  // https://www.w3.org/TR/xpath-functions/#func-implicit-timezone
  // Type is a dayTimeDuration.
  // We use a separate dataType since it makes TS type modifications and JS object copying easier.
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

export interface IDayTimeDurationRepresentation {
  hours: number;
  minutes: number;
  seconds: number;
  day: number;
}
export interface IYearMonthDuration {
  year: number;
  month: number;
}

export type IDurationRepresentation = IYearMonthDuration & IDayTimeDurationRepresentation;
export type IDateTimeRepresentation = IDateRepresentation & ITimeRepresentation;

// Important is to notice JS and XSD datatypes have different defaulted values
// | Field | Default in JS | Default in XSD_DayTime | Default in XSD_Duration |
// | Month | 0             | 1                      | 0                       |
// | Day   | 1             | 1                      | 0                       |

export function defaultedDayTimeDurationRepresentation(rep: Partial<IDayTimeDurationRepresentation>):
IDayTimeDurationRepresentation {
  return {
    day: rep.day || 0,
    hours: rep.hours || 0,
    minutes: rep.minutes || 0,
    seconds: rep.seconds || 0,
  };
}

export function defaultedDurationRepresentation(
  rep: Partial<IDurationRepresentation>,
): IDurationRepresentation {
  return {
    ...defaultedDayTimeDurationRepresentation(rep),
    month: rep.month || 0,
    year: rep.year || 0,
  };
}

export function defaultedDateTimeRepresentation(rep: Partial<IDateTimeRepresentation>): IDateTimeRepresentation {
  return {
    ...rep,
    day: rep.day || 1,
    hours: rep.hours || 0,
    month: rep.month || 1,
    year: rep.year || 0,
    seconds: rep.seconds || 0,
    minutes: rep.minutes || 0,
  };
}

export function toDateTimeRepresentation({ date, timeZone }:
{ date: Date; timeZone: ITimeZoneRepresentation }): IDateTimeRepresentation {
  return {
    year: date.getFullYear(),
    month: date.getMonth() + 1,
    day: date.getDate(),
    hours: date.getHours(),
    minutes: date.getMinutes(),
    seconds: date.getSeconds(),
    zoneHours: timeZone.zoneHours,
    zoneMinutes: timeZone.zoneMinutes,
  };
}

export function convertDurationToDateTime(dur: IDurationRepresentation): IDateTimeRepresentation {
  return {
    zoneHours: 0,
    zoneMinutes: 0,
    seconds: dur.seconds,
    minutes: dur.minutes,
    hours: dur.hours,
    day: dur.day + 1,
    month: dur.month + 1,
    year: dur.year,
  };
}

export function toJSDate(date: IDateTimeRepresentation): Date {
  // The given hours will be assumed to be local time.
  const res = new Date(
    date.year,
    date.month - 1,
    date.day,
    date.hours,
    date.minutes,
    Math.trunc(date.seconds),
    (date.seconds % 1) * 1_000,
  );
  if (0 <= date.year && date.year < 100) {
    // Special rule of date has gone int action:
    // eslint-disable-next-line max-len
    // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Date/Date#individual_date_and_time_component_values

    const jumpDeltaOfDate = 1_900;
    res.setFullYear(res.getFullYear() - jumpDeltaOfDate);
  }
  return res;
}

export function toUTCDate(date: Partial<IDateTimeRepresentation>,
  defaultTimezone: ITimeZoneRepresentation): Date {
  const localTime = toJSDate(defaultedDateTimeRepresentation(date));
  // This date has been constructed in machine local time, now we alter it to become UTC and convert to correct timezone
  return new Date(
    localTime.getTime() + (
      -1 * (date.zoneHours === undefined ? defaultTimezone.zoneHours : date.zoneHours) * 60 -
      (date.zoneMinutes === undefined ? defaultTimezone.zoneMinutes : date.zoneMinutes) -
      localTime.getTimezoneOffset()
    ) * 60 * 1_000,
  );
}

export function durationToMillies(dur: Partial<IDurationRepresentation>): number {
  return toJSDate(convertDurationToDateTime(defaultedDurationRepresentation(dur))).getTime();
}

export function extractYearMonthDur(dur: Partial<IDurationRepresentation>): Partial<IYearMonthDuration> {
  return { year: dur.year, month: dur.month };
}

export function extractDayTimeDur(dur: Partial<IDurationRepresentation>): Partial<IDayTimeDurationRepresentation> {
  return {
    day: dur.day,
    hours: dur.hours,
    minutes: dur.minutes,
    seconds: dur.seconds,
  };
}
