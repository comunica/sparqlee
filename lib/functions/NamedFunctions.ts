import type * as E from '../expressions';
import type * as C from '../util/Consts';
import { TypeAlias, TypeURL } from '../util/Consts';
import * as Err from '../util/Errors';

import { parseXSDDecimal, parseXSDFloat, parseXSDInteger } from '../util/Parsing';

import { bool, dateTime, declare, number, string } from './Helpers';
import type { OverloadTree } from './OverloadTree';

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

const xsdToString = {
  arity: 1,
  overloads: declare()
    .onNumeric1((val: E.NumericLiteral) => string(number(val.typedValue).str()))
    .onBoolean1Typed(val => string(bool(val).str()))
    .onTerm1((val: E.StringLiteral) => string(val.str()))
    .collect(),
};

const xsdToFloat = {
  arity: 1,
  overloads: declare()
    .onNumeric1((val: E.NumericLiteral) => number(val.typedValue))
    .onBoolean1Typed(val => number(val ? 1 : 0))
    .onUnary(TypeURL.XSD_STRING, (val: E.StringLiteral) => {
      const result = parseXSDFloat(val.str());
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_FLOAT);
      }
      return number(result);
    })
    .copy({ from: [ TypeURL.XSD_STRING ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .collect(),
};

const xsdToDouble = {
  arity: 1,
  overloads: declare()
    .onNumeric1((val: E.NumericLiteral) => number(val.typedValue, TypeURL.XSD_DOUBLE))
    .onBoolean1Typed(val => number(val ? 1 : 0, TypeURL.XSD_DOUBLE))
    .onUnary(TypeURL.XSD_STRING, (val: E.Term) => {
      const result = parseXSDFloat(val.str());
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_DOUBLE);
      }
      return number(result, TypeURL.XSD_DOUBLE);
    })
    .copy({ from: [ TypeURL.XSD_STRING ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .collect(),
};

const xsdToDecimal = {
  arity: 1,
  overloads: declare()
    .onNumeric1((val: E.Term) => {
      const result = parseXSDDecimal(val.str());
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_DECIMAL);
      }
      return number(result, TypeURL.XSD_DECIMAL);
    })
    .onString1((val: E.Term) => {
      const str = val.str();
      const result = /^([+-])?(\d+(\.\d+)?)$/u.test(str) ? parseXSDDecimal(str) : undefined;
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_DECIMAL);
      }
      return number(result, TypeURL.XSD_DECIMAL);
    })
    .copy({ from: [ TypeURL.XSD_STRING ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .onBoolean1Typed(val => number(val ? 1 : 0, TypeURL.XSD_DECIMAL))
    .collect(),
};

const xsdToInteger = {
  arity: 1,
  overloads: declare()
    .onBoolean1Typed(val => number(val ? 1 : 0, TypeURL.XSD_INTEGER))
    .onNumeric1((val: E.Term) => {
      const result = parseXSDInteger(val.str());
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_INTEGER);
      }
      return number(result, TypeURL.XSD_INTEGER);
    })
    .onString1((val: E.Term) => {
      const str = val.str();
      const result = /^\d+$/u.test(str) ? parseXSDInteger(str) : undefined;
      if (result === undefined) {
        throw new Err.CastError(val, TypeURL.XSD_INTEGER);
      }
      return number(result, TypeURL.XSD_INTEGER);
    })
    .copy({ from: [ TypeAlias.SPARQL_NUMERIC ], to: [ TypeAlias.SPARQL_NON_LEXICAL ]})
    .collect(),
};

const xsdToDatetime = {
  arity: 1,
  overloads: declare()
    .onUnary(TypeURL.XSD_DATE_TIME, (val: E.DateTimeLiteral) => val)
    .onUnary(TypeURL.XSD_STRING, (val: Term) => {
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
  overloads: declare()
    .onNumeric1((val: E.NumericLiteral) => bool(val.coerceEBV()))
    .onUnary(TypeURL.XSD_BOOLEAN, (val: Term) => bool(val.coerceEBV()))
    .onUnary(TypeURL.XSD_STRING, (val: Term) => {
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

export const namedDefinitions: Record<C.NamedOperator, IDefinition> = {
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
  [TypeURL.XSD_DATE]: xsdToDatetime,
  [TypeURL.XSD_BOOLEAN]: xsdToBoolean,
};

// ----------------------------------------------------------------------------
// The definitions and functionality for all operators
// ----------------------------------------------------------------------------

export interface IDefinition {
  arity: number | number[];
  overloads: OverloadTree;
}
