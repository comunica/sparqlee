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

export interface IYearMonthDurationRepresentation {
  year: number;
  month: number;
}

export type IDurationRepresentation = IYearMonthDurationRepresentation & IDayTimeDurationRepresentation;
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

export function defaultedYearMonthDurationRepresentation(rep: Partial<IYearMonthDurationRepresentation>):
IYearMonthDurationRepresentation {
  return {
    year: rep.year || 0,
    month: rep.month || 0,
  };
}

export function defaultedDurationRepresentation(
  rep: Partial<IDurationRepresentation>,
): IDurationRepresentation {
  return {
    ...defaultedDayTimeDurationRepresentation(rep),
    ...defaultedYearMonthDurationRepresentation(rep),
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

export function negateDuration(dur: Partial<IDurationRepresentation>): Partial<IDurationRepresentation> {
  return {
    year: dur.year !== undefined ? -1 * dur.year : undefined,
    month: dur.month !== undefined ? -1 * dur.month : undefined,
    day: dur.day !== undefined ? -1 * dur.day : undefined,
    hours: dur.hours !== undefined ? -1 * dur.hours : undefined,
    minutes: dur.minutes !== undefined ? -1 * dur.minutes : undefined,
    seconds: dur.seconds !== undefined ? -1 * dur.seconds : undefined,
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

  // Correction needed from local machine timezone to UTC
  const minutesCorrectionLocal = localTime.getTimezoneOffset();
  // Correction needed from UTC to provided timeZone
  const hourCorrectionUTC = date.zoneHours === undefined ? defaultTimezone.zoneHours : date.zoneHours;
  const minutesCorrectionUTC = date.zoneMinutes === undefined ? defaultTimezone.zoneMinutes : date.zoneMinutes;
  return new Date(
    localTime.getTime() - (minutesCorrectionLocal + hourCorrectionUTC * 60 + minutesCorrectionUTC) * 60 * 1_000,
  );
}

export function trimToYearMonthDuration(dur: Partial<IDurationRepresentation>):
Partial<IYearMonthDurationRepresentation> {
  return {
    year: dur.year,
    month: dur.month,
  };
}

export function trimToDayTimeDuration(dur: Partial<IDurationRepresentation>): Partial<IDayTimeDurationRepresentation> {
  return {
    day: dur.day,
    hours: dur.hours,
    minutes: dur.minutes,
    seconds: dur.seconds,
  };
}

export function yearMonthDurationsToMonths(dur: IYearMonthDurationRepresentation): number {
  return dur.year * 12 + dur.month;
}

export function dayTimeDurationsToSeconds(dur: IDayTimeDurationRepresentation): number {
  return (((dur.day * 24) + dur.hours) * 60 + dur.minutes) * 60 + dur.seconds;
}

export function extractRawTimeZone(zoneContained: string): string {
  const extraction = /(Z|([+-]\d\d:\d\d))?$/u.exec(zoneContained);
  // It is safe to cast here because the empty string can always match.
  return extraction![0];
}
