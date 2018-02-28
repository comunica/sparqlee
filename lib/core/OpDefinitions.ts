import * as RDF from 'rdf-data-model';

import { UnimplementedError } from '../util/Errors';
import * as E from './Expressions';
import * as C from '../util/Consts';
import { DataType as DT } from '../util/Consts';

export function makeOp(op: string, args: E.Expression[]): E.OperatorExpression {
  if (!(<any>Object).values(C.Operator).includes(op)) {
    throw new TypeError("Unknown operator");
  }

  if ((<any>Object).values(C.OverloadedOperator).includes(op)) {
    return makeOverloadedOp(op, args);
  }

  if ((<any>Object).values(C.SpecialOperator).includes(op)) {
    return makeSpecialOp(op, args);
  }

  return makeSimpleOp(op, args);
}

// =========================================================================

export function makeSimpleOp(op: string, args: E.Expression[]): E.SimpleOperator {
  let opDef = simpleOps[op];
  if (!opDef) {
    throw new TypeError("Unknown operator");
  }
  return new E.SimpleOperator(
    op,
    opDef.arity,
    args,
    opDef.types,
    opDef.apply
  );
}

interface SimpleOpDef {
  arity: number,
  types: E.ArgumentType[],
  // returnType: DataTypeCategory,
  apply(args: any[]): E.TermExpression,
}

interface SimpleOpMap { [key: string]: SimpleOpDef }
const simpleOps: SimpleOpMap = {
  // 'UMINUS': {
  //   arity: 1,
  //   types: [d('numeric')],
  //   apply: (args: E.NumericLiteral[]) => nl(-args[0].typedValue),
  // },
}

//=============================================================================

function makeOverloadedOp(op: string, args: E.Expression[]): E.OperatorExpression {
  let opDef = overloadedOpDef[op];
  if (!opDef) {
    throw new TypeError("Unknown operator");
  }
  return new E.OverloadedOperator(
    op,
    opDef.arity,
    args,
    opDef.overloadMap
  )
}

interface OverloadedOpDef {
  arity: number,
  overloadMap: E.OverloadMap,
}

interface OverloadedOpMap { [key: string]: OverloadedOpDef }
const overloadedOpDef: OverloadedOpMap = {
  '=': {
    arity: 2,
    overloadMap: []
      .concat(
        typeHelper('date', (args: E.DateTimeLiteral[]) => {
          throw new UnimplementedError();
        }))
      .concat(
        typeHelper('string', (args: E.StringLiteral[]) => {
          return bl(args[0].typedValue.localeCompare(args[0].typedValue) === 0);
        }))
      .concat(numericHelper(numEqual))
  },
  '+': {
    arity: 2,
    overloadMap: []
      .concat(
        numericHelper((args: E.NumericLiteral[]) => {
          let result = args[0].typedValue + args[1].typedValue;
          return nl(result, C.decategorize(args[0].category))
        })
      )
  }
}

function typeHelper(type: E.ArgumentType, func: OpFunc): E.OverloadMap {
  return [
    [[t(type), t(type)], func]
  ]
}

function numericHelper(func: (args: E.TermExpression[]) => TE): E.OverloadMap {
  return [
    [[t('integer'), t('integer')], func],
    [[t('float'), t('float')], func]
  ];
}

function numEqual(args: E.NumericLiteral[]): TE {
  return bl(args[0].typedValue === args[1].typedValue);
}


// Again, type inference sucks
function concat(m1: E.OverloadMap, m2: E.OverloadMap): E.OverloadMap {
  return m1.concat(m2);
}

//==============================================================================

function makeSpecialOp(op: string, args: E.Expression[]): E.OperatorExpression {
  throw new UnimplementedError();
}

//==============================================================================
// Util

type TE = E.TermExpression;
type OpFunc = (args: E.TermExpression[]) => TE;

function nl(val: number, type?: DT) {
  return new E.NumericLiteral(val, undefined, RDF.namedNode(type || DT.XSD_FLOAT));
}

function bl(val: boolean) {
  return new E.BooleanLiteral(val, undefined, RDF.namedNode(DT.XSD_BOOLEAN));
}

// Typescript inference sucks
function t(i: E.ArgumentType): E.ArgumentType {
  return i;
}

// Really fucking bad mans
function f(func: (args: E.TermExpression[]) => E.TermExpression):
  (args: E.TermExpression[]) => E.TermExpression {
  return func;
}