import * as Promise from 'bluebird';
import { Iterable, List, Map, Record } from 'immutable';
import { Impl, map } from './Helpers';

import * as C from '../../util/Consts';
import { DataType as DT } from '../../util/Consts';
import * as E from './../Expressions';
import * as S from './SPARQLFunctions';
import * as Special from './SpecialFunctions';
import * as X from './XPath';

import { UnimplementedError } from '../../util/Errors';

export function makeOp(op: string, args: E.IExpression[]): E.IOperatorExpression {
  if (!C.Operators.contains(op)) {
    throw new TypeError("Unknown operator");
  }

  const definitionMeta = definitions.get(<C.Operator> op);
  const { category, arity, definition } = definitionMeta;

  if (!definition) { throw new UnimplementedError(); }

  switch (category) {
    case 'simple': {
      const { types, apply } = <SimpleDefinition> definition;
      return new E.SimpleOperator(op, arity, args, types, apply);
    }
    case 'overloaded': {
      const overloadMap = <OverloadedDefinition> definition;
      return new E.OverloadedOperator(op, arity, args, overloadMap);
    }
    case 'special': {
      // tslint:disable-next-line:variable-name
      const SpecialOp = <SpecialDefinition> definition;
      return new SpecialOp(op, args);
    }
  }
}

// ----------------------------------------------------------------------------
// The definitions and functionality for all operators
// ----------------------------------------------------------------------------

interface IOperatorDefinition { }
type SpecificDefinition = SimpleDefinition | OverloadedDefinition | SpecialDefinition;
interface IDefinition {
  category: C.OperatorCategory;
  arity: number;
  definition: SpecificDefinition;
}

type IDefinitionMap = {[key in C.Operator]: IDefinition };

// tslint:disable-next-line:interface-over-type-literal
type SimpleDefinition = {
  types: E.ArgumentType[];
  apply(args: any[]): E.ITermExpression;
};

type OverloadedDefinition = E.OverloadMap;

type SpecialDefinition = new (op: string, args: E.IExpression[]) => E.IOperatorExpression;

const _definitions: IDefinitionMap = {
  // TODO: Check expressions parent types
  '!': {
    arity: 1,
    category: 'simple',
    definition: {
      types: [],
      apply: () => { throw new UnimplementedError(); }
    },
  },
  'UPLUS': {
    arity: 1,
    category: 'simple',
    definition: {
      types: [],
      apply: () => { throw new UnimplementedError(); }
    },
  },
  'UMINUS': {
    arity: 1,
    category: 'simple',
    definition: {
      types: [],
      apply: () => { throw new UnimplementedError(); }
    }
  },
  '&&': {
    arity: 2,
    category: 'special',
    definition: Special.LogicalAndAsync,
  },
  '||': {
    arity: 2,
    category: 'special',
    definition: Special.LogicalOrAsync,
  },
  '*': {
    arity: 2,
    category: 'overloaded',
    definition: arithmetic(X.numericMultiply),
  },
  '/': {
    arity: 2,
    category: 'overloaded',
    definition: arithmetic(X.numericDivide).set(
      list('integer', 'integer'),
      (args: Term[]) => number(binary(X.numericDivide, args), DT.XSD_DECIMAL),
    ),
  },
  '+': {
    arity: 2,
    category: 'overloaded',
    definition: arithmetic(X.numericAdd),
  },
  '-': {
    arity: 2,
    category: 'overloaded',
    definition: arithmetic(X.numericSubtract),
  },
  '=': {
    arity: 2,
    category: 'overloaded',
    definition: xPathTest(
      X.numericEqual,
      (left, right) => X.numericEqual(X.compare(left, right), 0),
      X.booleanEqual,
      X.dateTimeEqual,
    ).set(
      list('term', 'term'),
      (args: Term[]) => bool(S.RDFTermEqual(args[0], args[1])),
    ),
  },
  '!=': {
    arity: 2,
    category: 'overloaded',
    definition: xPathTest(
      (left, right) => !X.numericEqual(left, right),
      (left, right) => !X.numericEqual(X.compare(left, right), 0),
      (left, right) => !X.booleanEqual(left, right),
      (left, right) => !X.dateTimeEqual(left, right),
    ),
  },
  '<': {
    arity: 2,
    category: 'overloaded',
    definition: xPathTest(
      X.numericLessThan,
      (left, right) => X.numericEqual(X.compare(left, right), -1),
      X.booleanLessThan,
      X.dateTimeLessThan,
    ),
  },
  '>': {
    arity: 2,
    category: 'overloaded',
    definition: xPathTest(
      X.numericGreaterThan,
      (left, right) => X.numericEqual(X.compare(left, right), 1),
      X.booleanGreaterThan,
      X.dateTimeGreaterThan,
    ),
  },
  '<=': {
    arity: 2,
    category: 'overloaded',
    definition: xPathTest(
      (left, right) => X.numericLessThan(left, right) || X.numericEqual(left, right),
      (left, right) => !X.numericEqual(X.compare(left, right), 1),
      (left, right) => !X.booleanGreaterThan(left, right),
      (left, right) => !X.dateTimeGreaterThan(left, right),
    ),
  },
  '>=': {
    arity: 2,
    category: 'overloaded',
    definition: xPathTest(
      (left, right) => X.numericGreaterThan(left, right) || X.numericEqual(left, right),
      (left, right) => !X.numericEqual(X.compare(left, right), -1),
      (left, right) => !X.booleanLessThan(left, right),
      (left, right) => !X.dateTimeLessThan(left, right),
    ),
  },
};

const definitions = Map<C.Operator, IDefinition>(_definitions);

// ----------------------------------------------------------------------------
// Utility helpers
// ----------------------------------------------------------------------------

type Term = E.ITermExpression;

/*
 * Arithetic Operators take numbers, and return numbers.
 * Check 'numeric' for behaviour of the generic numeric helper.
 * https://www.w3.org/TR/sparql11-query/#OperatorMapping
 */
type ArithmeticOperator = (left: number, right: number) => number;
function arithmetic(op: ArithmeticOperator): E.OverloadMap {
  const func = (dt?: DT) => (
    (args: Term[]) => number(binary(op, args), dt || DT.XSD_FLOAT)
  );
  return map(numeric(func));
}

/*
 * XPath Tests take numbers, booleans, strings, simple strings, and dates,
 * and they return booleans.
 * Check 'numeric' for behaviour of the generic numeric helper.
 * https://www.w3.org/TR/sparql11-query/#OperatorMapping
 */
type XPathTest<T> = (left: T, right: T) => boolean;
function xPathTest(
  op: XPathTest<number>,
  strOp: XPathTest<string>,
  boolOp: XPathTest<boolean>,
  dateOp: XPathTest<Date>,
): E.OverloadMap {
  const numericHelper = (args: Term[]) => bool(binary(op, args));

  const wrap = (func: XPathTest<any>) => (args: Term[]) => bool(binary(func, args));
  return map([
    new Impl({ types: ['string', 'string'], func: wrap(strOp) }),
    new Impl({ types: ['simple', 'simple'], func: wrap(strOp) }),
    new Impl({ types: ['boolean', 'boolean'], func: wrap(boolOp) }),
    new Impl({ types: ['date', 'date'], func: wrap(dateOp) }),
  ].concat(numeric((dt?: DT) => numericHelper)));
}

type OpFactory = (dt?: C.DataType) => E.SimpleEvaluator;

/*
 * DataType will be generalized to float,
 * or to the the category-parent (interger, decimal, ...) if both have the same.
 */
function numeric(opFac: OpFactory): Impl[] {
  return [
    new Impl({ types: ['integer', 'integer'], func: opFac(DT.XSD_INTEGER) }),
    new Impl({ types: ['integer', 'decimal'], func: opFac() }),
    new Impl({ types: ['integer', 'float'], func: opFac() }),
    new Impl({ types: ['integer', 'double'], func: opFac() }),

    new Impl({ types: ['decimal', 'integer'], func: opFac() }),
    new Impl({ types: ['decimal', 'decimal'], func: opFac(DT.XSD_DECIMAL) }),
    new Impl({ types: ['decimal', 'float'], func: opFac() }),
    new Impl({ types: ['decimal', 'double'], func: opFac() }),

    new Impl({ types: ['float', 'integer'], func: opFac() }),
    new Impl({ types: ['float', 'decimal'], func: opFac() }),
    new Impl({ types: ['float', 'float'], func: opFac(DT.XSD_FLOAT) }),
    new Impl({ types: ['float', 'double'], func: opFac() }),

    new Impl({ types: ['double', 'integer'], func: opFac() }),
    new Impl({ types: ['double', 'decimal'], func: opFac() }),
    new Impl({ types: ['double', 'float'], func: opFac() }),
    new Impl({ types: ['double', 'double'], func: opFac(DT.XSD_DOUBLE) }),
  ];
}

type LiteralOp<T, R> = (left: T, right: T) => R;
function binary<T, R>(op: LiteralOp<T, R>, args: E.ITermExpression[]): R {
  const [left, right] = <E.Literal<T>[]> args;
  return op(left.typedValue, right.typedValue);
}

function bool(val: boolean): E.BooleanLiteral {
  return new E.BooleanLiteral(val, undefined, C.make(DT.XSD_BOOLEAN));
}

function number(num: number, dt?: C.DataType): E.NumericLiteral {
  return new E.NumericLiteral(num, undefined, C.make(dt || DT.XSD_FLOAT));
}

function list(...args: E.ArgumentType[]) {
  return List(args);
}

// // https://gist.github.com/JamieMason/172460a36a0eaef24233e6edb2706f83
// const compose = (...fns: Function[]) =>
//   fns.reverse().reduce((prevFn, nextFn) =>
//     (value: any) => nextFn(prevFn(value)),
//     (value: any) => value,
//   );
