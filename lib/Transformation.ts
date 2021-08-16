import type * as RDF from 'rdf-js';
import * as RDFString from 'rdf-string';
import { Algebra as Alg } from 'sparqlalgebrajs';

import type { AsyncExtensionFunction, AsyncExtensionFunctionCreator } from './evaluators/AsyncEvaluator';
import type { SyncExtensionFunction, SyncExtensionFunctionCreator } from './evaluators/SyncEvaluator';
import type { AsyncExtensionApplication, SimpleApplication } from './expressions';
import * as E from './expressions';
import { namedFunctions, regularFunctions, specialFunctions } from './functions';
import * as C from './util/Consts';
import { TypeURL, TypeURL as DT } from './util/Consts';
import * as Err from './util/Errors';
import { ExtensionFunctionError } from './util/Errors';
import * as P from './util/Parsing';
import { isSubTypeOf } from './util/TypeHandling';

type FunctionCreatorConfig = { type: 'sync'; creator: SyncExtensionFunctionCreator } |
{ type: 'async'; creator: AsyncExtensionFunctionCreator };

export function transformAlgebra(expr: Alg.Expression, creatorConfig: FunctionCreatorConfig): E.Expression {
  if (!expr) {
    throw new Err.InvalidExpression(expr);
  }
  const types = Alg.expressionTypes;

  switch (expr.expressionType) {
    case types.TERM:
      return transformTerm(<Alg.TermExpression> expr);
    case types.OPERATOR:
      return transformOperator(<Alg.OperatorExpression> expr, creatorConfig);
    case types.NAMED:
      return transformNamed(<Alg.NamedExpression> expr, creatorConfig);
    case types.EXISTENCE:
      return transformExistence(<Alg.ExistenceExpression> expr);
    case types.AGGREGATE:
      return transformAggregate(<Alg.AggregateExpression> expr);
    case types.WILDCARD:
      return transformWildcard(<Alg.WildcardExpression> expr);
    default: throw new Err.InvalidExpressionType(expr);
  }
}

/**
 * Transforms an RDF term to the internal representation of a term,
 * assuming it is not a variable, which would be an expression (internally).
 *
 * @param term RDF term to transform into internal representation of a term
 */
export function transformRDFTermUnsafe(term: RDF.Term): E.Term {
  return <E.Term> transformTerm({
    term,
    type: 'expression',
    expressionType: 'term',
  });
}

function transformTerm(term: Alg.TermExpression): E.Expression {
  if (!term.term) {
    throw new Err.InvalidExpression(term);
  }

  switch (term.term.termType) {
    case 'Variable': return new E.Variable(RDFString.termToString(term.term));
    case 'Literal': return transformLiteral(term.term);
    case 'NamedNode': return new E.NamedNode(term.term.value);
    case 'BlankNode': return new E.BlankNode(term.term.value);
    default: throw new Err.InvalidTermType(term);
  }
}

function transformWildcard(term: Alg.WildcardExpression): E.Expression {
  if (!term.wildcard) {
    throw new Err.InvalidExpression(term);
  }

  return new E.NamedNode(term.wildcard.value);
}

/**
 * @param lit the rdf literal we want to transform to an internal Literal expression.
 */
export function transformLiteral(lit: RDF.Literal): E.Literal<any> {
  // Both here and within the switch we transform to LangStringLiteral or StringLiteral.
  // We do this when we detect a simple literal being used.
  // Original issue regarding this behaviour: https://github.com/w3c/sparql-12/issues/112
  if (!lit.datatype || [ null, undefined, '' ].includes(lit.datatype.value)) {
    return lit.language ?
      new E.LangStringLiteral(lit.value, lit.language) :
      new E.StringLiteral(lit.value);
  }

  const dataType = lit.datatype.value;

  if (isSubTypeOf(dataType, TypeURL.XSD_STRING)) {
    return new E.StringLiteral(lit.value, dataType);
  }
  if (isSubTypeOf(dataType, DT.RDF_LANG_STRING)) {
    return new E.LangStringLiteral(lit.value, lit.language);
  }
  if (isSubTypeOf(dataType, DT.XSD_DATE_TIME)) {
    // It should be noted how we don't care if its a XSD_DATE_TIME_STAMP or not.
    // This is because sparql functions don't care about the timezone.
    // It's also doesn't break the specs because we keep the string representation stored,
    // that way we can always give it back. There are also no sparql functions that alter a date.
    // (So the representation initial representation always stays valid)
    // https://github.com/comunica/sparqlee/pull/103#discussion_r688462368
    const dateVal: Date = new Date(lit.value);
    if (Number.isNaN(dateVal.getTime())) {
      return new E.NonLexicalLiteral(undefined, dataType, lit.value);
    }
    return new E.DateTimeLiteral(new Date(lit.value), lit.value, dataType);
  }
  if (isSubTypeOf(dataType, DT.XSD_BOOLEAN)) {
    if (lit.value !== 'true' && lit.value !== 'false' && lit.value !== '1' && lit.value !== '0') {
      return new E.NonLexicalLiteral(undefined, dataType, lit.value);
    }
    return new E.BooleanLiteral(lit.value === 'true' || lit.value === '1', lit.value);
  }
  if (isSubTypeOf(dataType, DT.XSD_DECIMAL)) {
    const intVal: number = P.parseXSDDecimal(lit.value);
    if (intVal === undefined) {
      return new E.NonLexicalLiteral(undefined, dataType, lit.value);
    }
    return new E.NumericLiteral(intVal, dataType, lit.value);
  }
  if (isSubTypeOf(dataType, DT.XSD_FLOAT) || isSubTypeOf(dataType, DT.XSD_DOUBLE)) {
    const doubleVal: number = P.parseXSDFloat(lit.value);
    if (doubleVal === undefined) {
      return new E.NonLexicalLiteral(undefined, dataType, lit.value);
    }
    return new E.NumericLiteral(doubleVal, dataType, lit.value);
  }
  return new E.Literal<string>(lit.value, dataType, lit.value);
}

function transformOperator(expr: Alg.OperatorExpression, creatorConfig: FunctionCreatorConfig):
E.OperatorExpression | E.SpecialOperatorExpression {
  if (C.SpecialOperators.has(expr.operator)) {
    const specialOp = <C.SpecialOperator> expr.operator;
    const specialArgs = expr.args.map(arg => transformAlgebra(arg, creatorConfig));
    const specialFunc = specialFunctions[specialOp];
    if (!specialFunc.checkArity(specialArgs)) {
      throw new Err.InvalidArity(specialArgs, specialOp);
    }
    return new E.SpecialOperator(specialArgs, specialFunc.applyAsync, specialFunc.applySync);
  }
  if (!C.Operators.has(expr.operator)) {
    throw new Err.UnknownOperator(expr.operator);
  }
  const regularOp = <C.RegularOperator> expr.operator;
  const regularArgs = expr.args.map(arg => transformAlgebra(arg, creatorConfig));
  const regularFunc = regularFunctions[regularOp];
  if (!hasCorrectArity(regularArgs, regularFunc.arity)) {
    throw new Err.InvalidArity(regularArgs, regularOp);
  }
  return new E.Operator(regularArgs, regularFunc.apply);
}

function wrapSyncFunction(func: SyncExtensionFunction, name: string): SimpleApplication {
  return args => {
    try {
      const res = func(args.map(arg => arg.toRDF()));
      return transformRDFTermUnsafe(res);
    } catch (error: unknown) {
      throw new ExtensionFunctionError(name, error);
    }
  };
}

function wrapAsyncFunction(func: AsyncExtensionFunction, name: string): AsyncExtensionApplication {
  return async args => {
    try {
      const res = await func(args.map(arg => arg.toRDF()));
      return transformRDFTermUnsafe(res);
    } catch (error: unknown) {
      throw new ExtensionFunctionError(name, error);
    }
  };
}
// TODO: Support passing functions to override default behaviour;
function transformNamed(expr: Alg.NamedExpression, creatorConfig: FunctionCreatorConfig):
E.NamedExpression | E.AsyncExtensionExpression | E.SyncExtensionExpression {
  const funcName = expr.name.value;
  const args = expr.args.map(arg => transformAlgebra(arg, creatorConfig));
  if (C.NamedOperators.has(<C.NamedOperator> funcName)) {
    // Return a basic named expression
    const op = <C.NamedOperator> expr.name.value;
    const namedFunc = namedFunctions[op];
    return new E.Named(expr.name, args, namedFunc.apply);
  }
  if (creatorConfig.type === 'sync') {
    // Expression might be extension function, check this for the sync
    const syncExtensionFunc = creatorConfig.creator(expr.name);
    if (syncExtensionFunc) {
      const simpleAppl = wrapSyncFunction(syncExtensionFunc, expr.name.value);
      return new E.SyncExtension(expr.name, args, simpleAppl);
    }
  } else {
    // The expression might be an extension function, check this for the async case
    const asyncExtensionFunc = creatorConfig.creator(expr.name);
    if (asyncExtensionFunc) {
      const asyncAppl = wrapAsyncFunction(asyncExtensionFunc, expr.name.value);
      return new E.AsyncExtension(expr.name, args, asyncAppl);
    }
  }
  throw new Err.UnknownNamedOperator(expr.name.value);
}

function hasCorrectArity(args: E.Expression[], arity: number | number[]): boolean {
  // Infinity is used to represent var-args, so it's always correct.
  if (arity === Number.POSITIVE_INFINITY) {
    return true;
  }

  // If the function has overloaded arity, the actual arity needs to be present.
  if (Array.isArray(arity)) {
    return arity.includes(args.length);
  }

  return args.length === arity;
}

export function transformAggregate(expr: Alg.AggregateExpression): E.Aggregate {
  const name = expr.aggregator;
  return new E.Aggregate(name, expr);
}

export function transformExistence(expr: Alg.ExistenceExpression): E.Existence {
  return new E.Existence(expr);
}
