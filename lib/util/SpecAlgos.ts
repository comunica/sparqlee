import type {
  IDurationRepresentation,
  IDateTimeRepresentation, ITimeZoneRepresentation,
} from './DateTimeHelpers';
import { toUTCDate } from './DateTimeHelpers';

function fQuotient(first: number, second: number): number {
  return Math.floor(first / second);
}

function modulo(first: number, second: number): number {
  return first - fQuotient(first, second) * second;
}

function fQuotient3(arg: number, low: number, high: number): number {
  return fQuotient(arg - low, high - low);
}

function modulo3(arg: number, low: number, high: number): number {
  return modulo(arg - low, high - low) + low;
}

export function maximumDayInMonthFor(yearValue: number, monthValue: number): number {
  const month = modulo3(monthValue, 1, 13);
  const year = yearValue + fQuotient3(monthValue, 1, 13);

  if ([ 1, 3, 5, 7, 8, 10, 12 ].includes(month)) {
    return 31;
  }
  if ([ 4, 6, 9, 11 ].includes(month)) {
    return 30;
  }
  if (month === 2 && (modulo(year, 400) === 0 || (modulo(year, 100) !== 0 && modulo(year, 4) === 0))) {
    return 29;
  }
  return 28;
}

// https://www.w3.org/TR/xmlschema-2/#adding-durations-to-dateTimes
export function addDurationToDateTime(date: IDateTimeRepresentation, duration: IDurationRepresentation):
IDateTimeRepresentation {
  // Used to cary over optional fields like timezone
  const newDate: IDateTimeRepresentation = { ...date };

  // Month
  let temp = date.month + duration.month;
  newDate.month = modulo3(temp, 1, 13);
  let carry = fQuotient3(temp, 1, 13);
  // Year
  newDate.year = date.year + duration.year + carry;
  // Seconds
  temp = date.seconds + duration.seconds;
  newDate.seconds = modulo(temp, 60);
  carry = fQuotient(temp, 60);
  // Minutes
  temp = date.minutes + duration.minutes + carry;
  newDate.minutes = modulo(temp, 60);
  carry = fQuotient(temp, 60);
  // Hours
  temp = date.hours + duration.hours + carry;
  newDate.hours = modulo(temp, 24);
  carry = fQuotient(temp, 24);

  // Days
  temp = maximumDayInMonthFor(newDate.year, newDate.month);
  // Defined spec code can not happen since it would be an invalid literal?
  //
  // if (date.day > temp) {
  // tempDays = temp;
  // } else if (date.day < 1) {
  // tempDays = 1;
  // } else {
  // tempDays = date.day;
  // }
  //
  const tempDays = date.day;

  newDate.day = tempDays + duration.day + carry;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    if (newDate.day < 1) {
      newDate.day += maximumDayInMonthFor(newDate.year, newDate.month - 1);
      carry = -1;
    } else if (newDate.day > maximumDayInMonthFor(newDate.year, newDate.month)) {
      newDate.day -= maximumDayInMonthFor(newDate.year, newDate.month);
      carry = 1;
    } else {
      break;
    }
    temp = newDate.month + carry;
    newDate.month = modulo3(temp, 1, 13);
    newDate.year += fQuotient3(temp, 1, 13);
  }
  return newDate;
}

export function elapsedDuration(first: IDateTimeRepresentation,
  second: IDateTimeRepresentation, defaultTimeZone: ITimeZoneRepresentation): Partial<IDurationRepresentation> {
  const d1 = toUTCDate(first, defaultTimeZone);
  const d2 = toUTCDate(second, defaultTimeZone);
  const diff = d1.getTime() - d2.getTime();
  return {
    day: Math.floor(diff / (1_000 * 60 * 60 * 24)),
    hours: Math.floor((diff % (1_000 * 60 * 60 * 24)) / (1_000 * 60 * 60)),
    minutes: Math.floor(diff % (1_000 * 60 * 60) / (1_000 * 60)),
    seconds: diff % (1_000 * 60),
  };
}
