import type { DateTimeLiteral } from '../expressions';
import * as E from '../expressions';
import type * as C from '../util/Consts';
import { TypeAlias, TypeURL } from '../util/Consts';
import * as Err from '../util/Errors';

import { parseXSDDecimal, parseXSDFloat, parseXSDInteger } from '../util/Parsing';

import type { IOverloadedDefinition } from './Core';
import { bool, dateTime, decimal, declare, double, float, integer, string } from './Helpers';

type Term = E.TermExpression;

// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// Begin definitions.

// ----------------------------------------------------------------------------
// XPath Constructor functions
// https://www.w3.org/TR/sparql11-query/#
// https://www.w3.org/TR/xpath-functions/#casting-from-primitive-to-primitive
// ----------------------------------------------------------------------------

/**
 * https://www.w3.org/TR/xpath-functions/#casting-to-string
 */
const xsdToString = {
  arity: 1,
  overloads: declare(TypeURL.XSD_STRING)
    .onNumeric1(() => (val: E.NumericLiteral) => string(float(val.typedValue).str()))
    .onBoolean1Typed(() => val => string(bool(val).str()))
    .onTerm1(() => (val: E.StringLiteral) => string(val.str()))
    .collect(),
};

const xsdToFloat = {
  arity: 1,
  overloads: declare(TypeURL.XSD_FLOAT)
    .onNumeric1(() => (val: E.NumericLiteral) => float(val.typedValue))
    .onBoolean1Typed(() => val => float(val ? 1 : 0))
    .onUnary(TypeURL.XSD_STRING, () => (val: E.StringLiteral) => {
      const result = parseXSDFloat(val.str());
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_FLOAT);
      }
      return float(result);
    })
    .copy({ from: [ TypeURL.XSD_STRING ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .collect(),
};

const xsdToDouble = {
  arity: 1,
  overloads: declare(TypeURL.XSD_DOUBLE)
    .onNumeric1(() => (val: E.NumericLiteral) => double(val.typedValue))
    .onBoolean1Typed(() => val => double(val ? 1 : 0))
    .onUnary(TypeURL.XSD_STRING, () => (val: E.Term) => {
      const result = parseXSDFloat(val.str());
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_DOUBLE);
      }
      return double(result);
    })
    .copy({ from: [ TypeURL.XSD_STRING ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .collect(),
};

const xsdToDecimal = {
  arity: 1,
  overloads: declare(TypeURL.XSD_DECIMAL)
    .onNumeric1(() => (val: E.Term) => {
      const result = parseXSDDecimal(val.str());
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_DECIMAL);
      }
      return decimal(result);
    })
    .onString1(() => (val: E.Term) => {
      const str = val.str();
      const result = /^([+-])?(\d+(\.\d+)?)$/u.test(str) ? parseXSDDecimal(str) : undefined;
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_DECIMAL);
      }
      return decimal(result);
    })
    .copy({ from: [ TypeURL.XSD_STRING ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .onBoolean1Typed(() => val => decimal(val ? 1 : 0))
    .collect(),
};

const xsdToInteger = {
  arity: 1,
  overloads: declare(TypeURL.XSD_INTEGER)
    .onBoolean1Typed(() => val => integer(val ? 1 : 0))
    .onNumeric1(() => (val: E.Term) => {
      const result = parseXSDInteger(val.str());
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_INTEGER);
      }
      return integer(result);
    })
    .onString1(() => (val: E.Term) => {
      const str = val.str();
      const result = /^\d+$/u.test(str) ? parseXSDInteger(str) : undefined;
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_INTEGER);
      }
      return integer(result);
    })
    .copy({ from: [ TypeAlias.SPARQL_NUMERIC ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .collect(),
};

const xsdToDatetime = {
  arity: 1,
  overloads: declare(TypeURL.XSD_DATE_TIME)
    .onUnary(TypeURL.XSD_DATE_TIME, () => (val: E.DateTimeLiteral) => val)
    .onUnary(TypeURL.XSD_STRING, () => (val: Term) => {
      const date = new Date(val.str());
      if (Number.isNaN(date.getTime())) {
        throw new Err.CastError(val, TypeURL.XSD_DATE_TIME);
      }
      return dateTime(date, val.str());
    })
    .copy({ from: [ TypeURL.XSD_STRING ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .collect(),
};

const xsdToBoolean = {
  arity: 1,
  overloads: declare(TypeURL.XSD_BOOLEAN)
    .onNumeric1(() => (val: E.NumericLiteral) => bool(val.coerceEBV()))
    .onUnary(TypeURL.XSD_BOOLEAN, () => (val: Term) => bool(val.coerceEBV()))
    .onUnary(TypeURL.XSD_STRING, () => (val: Term) => {
      switch (val.str()) {
        case 'true':
          return bool(true);
        case 'false':
          return bool(false);
        case '1':
          return bool(true);
        case '0':
          return bool(false);
        default:
          throw new Err.CastError(val, TypeURL.XSD_BOOLEAN);
      }
    })
    .copy({ from: [ TypeURL.XSD_STRING ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .collect(),
};

// End definitions.
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------
// ----------------------------------------------------------------------------

function getTimeFromDate(date: Date): number {
  const milliSecondsInSecond = 1_000;
  const minuteInSeconds = 60;
  return date.getUTCMilliseconds() +
    milliSecondsInSecond * (date.getUTCMinutes() + date.getUTCHours() * minuteInSeconds);
}

class WrongDateRepresentation extends Error {
  public constructor(str: string) {
    super(`Could not convert ${str} to a date`);
  }
}

function safelyGetDate(val: string): Date {
  const giveDate = new Date(val);
  if (Number.isNaN(giveDate.valueOf())) {
    throw new WrongDateRepresentation(val);
  }
  return giveDate;
}

function safelyGetDateFromTime(val: string): Date {
  const values = val.split(':').map(x => Number(x));
  const giveDate = new Date(val);
  if (Number.isNaN(giveDate.valueOf()) || values.length !== 3 || values[2] >= 60) {
    throw new WrongDateRepresentation(val);
  }
  return giveDate;
}

// Additional definitions to implement https://github.com/w3c/sparql-12/blob/main/SEP/SEP-0002/sep-0002.md
const xsdToTime = {
  arity: 1,
  overloads: declare(TypeURL.XSD_TIME)
    .onUnary(TypeURL.XSD_TIME, () => (val: DateTimeLiteral) => val)
    .onUnary(TypeURL.XSD_DATE_TIME, () => (val: Term) => {
      const giveDate = safelyGetDate(val.str());
      const date = new Date(getTimeFromDate(giveDate));
      return new E.DateTimeLiteral(date, val.str(), TypeURL.XSD_TIME);
    })
    .onStringly1(() => (val: Term) => {
      const giveDate = safelyGetDateFromTime(val.str());
      const date = new Date(getTimeFromDate(giveDate));
      return new E.DateTimeLiteral(date, val.str(), TypeURL.XSD_TIME);
    })
    .collect(),
};

const xsdToDate = {
  arity: 1,
  overloads: declare(TypeURL.XSD_DATE)
    .onUnary(TypeURL.XSD_DATE, () => (val: DateTimeLiteral) => val)
    .onUnary(TypeURL.XSD_DATE_TIME, () => (val: Term) => {
      const giveDate = safelyGetDate(val.str());
      const date = new Date(giveDate.getTime() - getTimeFromDate(giveDate));
      return new E.DateTimeLiteral(date, val.str(), TypeURL.XSD_DATE);
    })
    .onStringly1(() => (val: E.Term) => {
      const giveDate = safelyGetDate(val.str());
      const date = new Date(giveDate.getTime() - getTimeFromDate(giveDate));
      return new E.DateTimeLiteral(date, val.str(), TypeURL.XSD_DATE);
    })
    .collect(),
};

const xsdToDuration = {
  arity: 1,
  overloads: declare(TypeURL.XSD_DURATION)
    .onUnary(TypeURL.XSD_DURATION, () => (val: E.DecimalLiteral) => val)
    .onStringly1(() => (val: Term) => {
      val.str().split('T')[0].replace(/^(-)?P(\d+Y)?(\d+M)?(\d+D)?$/gu, '$1S:$2:$3:$4');
      'P3Y1DT2H7S'.split('T')[1].replace(/^(\d+H)?(\d+M)?(\d+\.?\d*S)?$/gu, '$1:$2:$3');
      return new E.Literal<number>(0, TypeURL.XSD_DURATION);
    }).collect(),
};

const xsdToDateTimeDuration = {

};

const xsdToYearMonthDuration = {

};

export const namedDefinitions: Record<C.NamedOperator, IOverloadedDefinition> = {
  // --------------------------------------------------------------------------
  // XPath Constructor functions
  // https://www.w3.org/TR/sparql11-query/#FunctionMapping
  // --------------------------------------------------------------------------
  [TypeURL.XSD_STRING]: xsdToString,
  [TypeURL.XSD_FLOAT]: xsdToFloat,
  [TypeURL.XSD_DOUBLE]: xsdToDouble,
  [TypeURL.XSD_DECIMAL]: xsdToDecimal,
  [TypeURL.XSD_INTEGER]: xsdToInteger,
  [TypeURL.XSD_DATE_TIME]: xsdToDatetime,
  [TypeURL.XSD_DATE]: xsdToDate,
  [TypeURL.XSD_BOOLEAN]: xsdToBoolean,
  [TypeURL.XSD_TIME]: xsdToTime,
  [TypeURL.XSD_DURATION]: xsdToDuration,
};
