import type { ICompleteDurationRepresentation,
  IDateTimeRepresentation } from './DateTimeHelpers';

function fQuotient(a: number, b: number): number {
  return Math.floor(a / b);
}

function modulo(a: number, b: number): number {
  return a - fQuotient(a, b) * b;
}

function fQuotient3(a: number, low: number, high: number): number {
  return fQuotient(a - low, high - low);
}

function modulo3(a: number, low: number, high: number): number {
  return modulo(a - low, high - low) + low;
}

function maximumDayInMonthFor(yearValue: number, monthValue: number): number {
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
export function addDurationToDateTime(date: IDateTimeRepresentation, duration: ICompleteDurationRepresentation):
IDateTimeRepresentation {
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
  let tempDays;
  temp = maximumDayInMonthFor(newDate.year, newDate.month);
  if (date.day > temp) {
    tempDays = temp;
  } else if (date.day < 1) {
    tempDays = 1;
  } else {
    tempDays = date.day;
  }
  newDate.day = tempDays + duration.day + carry;
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
