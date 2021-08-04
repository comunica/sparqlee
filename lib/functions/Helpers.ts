/**
 * These helpers provide a (albeit inflexible) DSL for writing function
 * definitions for the SPARQL functions.
 */

import { List, Map, Record } from 'immutable';

import * as E from '../expressions';
import * as C from '../util/Consts';
import { TypeURL } from '../util/Consts';
import * as Err from '../util/Errors';

import type { ArgumentType, OverloadMap } from './Core';
import { promote } from './Core';

type Term = E.TermExpression;

export function declare(): Builder {
  return new Builder();
}

export class Builder {
  private implementations: Impl[] = [];

  collect(): OverloadMap {
    return map(this.implementations);
  }

  log(): Builder {
    console.log(this.implementations);
    return this;
  }

  add(impl: Impl): Builder {
    this.implementations.push(impl);
    return this;
  }

  set(argTypes: ArgumentType[], func: E.SimpleApplication): Builder {
    const types = List(argTypes);
    return this.add(new Impl({ types, func }));
  }

  copy({ from, to }: { from: ArgumentType[]; to: ArgumentType[] }): Builder {
    const last = this.implementations.length - 1;
    const _from = List(from);
    for (let i = last; i >= 0; i--) {
      const impl = this.implementations[i];
      if (impl.get('types').equals(_from)) {
        return this.set(to, impl.get('func'));
      }
    }
    throw new Err.UnexpectedError(
      'Tried to copy implementation, but types not found',
      { from, to },
    );
  }

  onUnary<T extends Term>(type: ArgumentType, op: (val: T) => Term) {
    return this.set([ type ], ([ val ]: [T]) => op(val));
  }

  onUnaryTyped<T>(type: ArgumentType, op: (val: T) => Term) {
    return this.set([ type ], ([ val ]: [E.Literal<T>]) => op(val.typedValue));
  }

  onBinary<L extends Term, R extends Term>(types: ArgumentType[], op: (left: L, right: R) => Term) {
    return this.set(types, ([ left, right ]: [L, R]) => op(left, right));
  }

  onBinaryTyped<L, R>(types: ArgumentType[], op: (left: L, right: R) => Term) {
    return this.set(types, ([ left, right ]: [E.Literal<L>, E.Literal<R>]) => op(left.typedValue, right.typedValue));
  }

  onTernaryTyped<A1, A2, A3>(types: ArgumentType[], op: (a1: A1, a2: A2, a3: A3) => Term) {
    return this.set(types, ([ a1, a2, a3 ]: [E.Literal<A1>, E.Literal<A2>, E.Literal<A3>]) => op(a1.typedValue, a2.typedValue, a3.typedValue));
  }

  onTernary<
    A1 extends Term,
    A2 extends Term,
    A3 extends Term
  >(types: ArgumentType[], op: (a1: A1, a2: A2, a3: A3) => Term) {
    return this.set(types, ([ a1, a2, a3 ]: [A1, A2, A3]) => op(a1, a2, a3));
  }

  onQuaternaryTyped<A1, A2, A3, A4>(types: ArgumentType[], op: (a1: A1, a2: A2, a3: A3, a4: A4) => Term) {
    return this.set(types, ([ a1, a2, a3, a4 ]: [E.Literal<A1>, E.Literal<A2>, E.Literal<A3>, E.Literal<A4>]) => op(a1.typedValue, a2.typedValue, a3.typedValue, a4.typedValue));
  }

  unimplemented(msg: string): Builder {
    for (let arity = 0; arity <= 5; arity++) {
      const types = new Array(arity).fill('term');
      const func = (_args: Term[]) => { throw new Err.UnimplementedError(msg); };
      this.set(types, func);
    }
    return this;
  }

  onTerm1(op: (term: Term) => Term): Builder {
    return this.set([ 'term' ], ([ term ]: [Term]) => op(term));
  }

  onLiteral1<T>(op: (lit: E.Literal<T>) => Term): Builder {
    return this.set([ 'literal' ], ([ term ]: [E.Literal<T>]) => op(term));
  }

  onBoolean1(op: (lit: E.BooleanLiteral) => Term): Builder {
    return this
      .set([ 'boolean' ], ([ lit ]: [E.BooleanLiteral]) => op(lit));
  }

  onBoolean1Typed(op: (lit: boolean) => Term): Builder {
    return this
      .set([ 'boolean' ], ([ lit ]: [E.BooleanLiteral]) => op(lit.typedValue));
  }

  onString1(op: (lit: E.Literal<string>) => Term): Builder {
    return this
      .set([ 'string' ], ([ lit ]: [E.Literal<string>]) => op(lit));
  }

  onString1Typed(op: (lit: string) => Term): Builder {
    return this
      .set([ 'string' ], ([ lit ]: [E.Literal<string>]) => op(lit.typedValue));
  }

  onLangString1(op: (lit: E.LangStringLiteral) => Term): Builder {
    return this
      .set([ 'langString' ], ([ lit ]: [E.LangStringLiteral]) => op(lit));
  }

  onStringly1(op: (lit: E.Literal<string>) => Term): Builder {
    return this
      .set([ 'string' ], ([ lit ]: [E.Literal<string>]) => op(lit))
      .set([ 'langString' ], ([ lit ]: [E.Literal<string>]) => op(lit));
  }

  onStringly1Typed(op: (lit: string) => Term): Builder {
    return this
      .set([ 'string' ], ([ lit ]: [E.Literal<string>]) => op(lit.typedValue))
      .set([ 'langString' ], ([ lit ]: [E.Literal<string>]) => op(lit.typedValue));
  }

  onNumeric1(op: (val: E.NumericLiteral) => Term): Builder {
    return this
      .set([ 'integer' ], ([ val ]: [E.NumericLiteral]) => op(val))
      .set([ 'decimal' ], ([ val ]: [E.NumericLiteral]) => op(val))
      .set([ 'float' ], ([ val ]: [E.NumericLiteral]) => op(val))
      .set([ 'double' ], ([ val ]: [E.NumericLiteral]) => op(val))
      .invalidLexicalForm([ 'nonlexical' ], 1);
  }

  onDateTime1(op: (date: E.DateTimeLiteral) => Term): Builder {
    return this
      .set([ 'date' ], ([ val ]: [E.DateTimeLiteral]) => op(val))
      .invalidLexicalForm([ 'nonlexical' ], 1);
  }

  /**
   * Arithmetic operators take 2 numeric arguments, and return a single numerical
   * value. The type of the return value is heavily dependant on the types of the
   * input arguments. In JS everything is a double, but in SPARQL it is not.
   *
   * {@link https://www.w3.org/TR/sparql11-query/#OperatorMapping}
   * {@link https://www.w3.org/TR/xpath-functions/#op.numeric}
   *
   * @param op the (simple) binary mathematical operator that
   */
  arithmetic(op: (left: number, right: number) => number): Builder {
    return this.numeric(([ left, right ]: E.NumericLiteral[]) => {
      const promotionType = promote(left.type, right.type);
      const resultType = C.decategorize(promotionType);
      return number(op(left.typedValue, right.typedValue), resultType);
    });
  }

  numberTest(test: (left: number, right: number) => boolean): Builder {
    return this.numeric(([ left, right ]: E.NumericLiteral[]) => {
      const result = test(left.typedValue, right.typedValue);
      return bool(result);
    });
  }

  stringTest(test: (left: string, right: string) => boolean): Builder {
    return this
      .set(
        [ 'string', 'string' ],
        ([ left, right ]: E.StringLiteral[]) => {
          const result = test(left.typedValue, right.typedValue);
          return bool(result);
        },
      )
      .invalidLexicalForm([ 'nonlexical', 'string' ], 1)
      .invalidLexicalForm([ 'string', 'nonlexical' ], 2);
  }

  booleanTest(test: (left: boolean, right: boolean) => boolean): Builder {
    return this
      .set(
        [ 'boolean', 'boolean' ],
        ([ left, right ]: E.BooleanLiteral[]) => {
          const result = test(left.typedValue, right.typedValue);
          return bool(result);
        },
      )
      .invalidLexicalForm([ 'nonlexical', 'boolean' ], 1)
      .invalidLexicalForm([ 'boolean', 'nonlexical' ], 2);
  }

  dateTimeTest(test: (left: Date, right: Date) => boolean): Builder {
    return this
      .set(
        [ 'date', 'date' ],
        ([ left, right ]: E.DateTimeLiteral[]) => {
          const result = test(left.typedValue, right.typedValue);
          return bool(result);
        },
      )
      .invalidLexicalForm([ 'nonlexical', 'date' ], 1)
      .invalidLexicalForm([ 'date', 'nonlexical' ], 2);
  }

  numeric(op: E.SimpleApplication): Builder {
    return this
      .set([ 'integer', 'integer' ], op)
      .set([ 'integer', 'decimal' ], op)
      .set([ 'integer', 'float' ], op)
      .set([ 'integer', 'double' ], op)
      .invalidLexicalForm([ 'integer', 'nonlexical' ], 2)

      .set([ 'decimal', 'integer' ], op)
      .set([ 'decimal', 'decimal' ], op)
      .set([ 'decimal', 'float' ], op)
      .set([ 'decimal', 'double' ], op)
      .invalidLexicalForm([ 'decimal', 'nonlexical' ], 2)

      .set([ 'float', 'integer' ], op)
      .set([ 'float', 'decimal' ], op)
      .set([ 'float', 'float' ], op)
      .set([ 'float', 'double' ], op)
      .invalidLexicalForm([ 'float', 'nonlexical' ], 2)

      .set([ 'double', 'integer' ], op)
      .set([ 'double', 'decimal' ], op)
      .set([ 'double', 'float' ], op)
      .set([ 'double', 'double' ], op)
      .invalidLexicalForm([ 'double', 'nonlexical' ], 2)

      .invalidLexicalForm([ 'nonlexical', 'integer' ], 1)
      .invalidLexicalForm([ 'nonlexical', 'decimal' ], 1)
      .invalidLexicalForm([ 'nonlexical', 'float' ], 1)
      .invalidLexicalForm([ 'nonlexical', 'double' ], 1);
  }

  invalidLexicalForm(types: ArgumentType[], index: number): Builder {
    return this.set(types, (args: Term[]): E.TermExpression => {
      throw new Err.InvalidLexicalForm(args[index - 1].toRDF());
    });
  }

  private chain(impls: Impl[]): Builder {
    this.implementations = this.implementations.concat(impls);
    return this;
  }
}

// ----------------------------------------------------------------------------
// Type Safety Helpers
// ----------------------------------------------------------------------------

/**
 * Immutable.js type definitions are pretty unsafe, and this is typo-prone work.
 * These helpers allow use to create OverloadMaps with more type-safety.
 * One entry in the OverloadMap is described by the record Impl;
 *
 * A list of Impl's then gets constructed into an Immutable.js Map.
 *
 * See:
 * https://medium.com/@alexxgent/enforcing-types-with-immutablejs-and-typescript-6ab980819b6a
 */

export interface ImplType {
  types: List<ArgumentType>;
  func: E.SimpleApplication;
}

const implDefaults = {
  types: [] as ArgumentType[],
  func() {
    const msg = 'Implementation not set yet declared as implemented';
    throw new Err.UnexpectedError(msg);
  },
};

export class Impl extends Record(implDefaults) {
  constructor(params: ImplType) { super(params); }

  get<T extends keyof ImplType>(value: T): ImplType[T] {
    return super.get(value);
  }

  toPair(): [List<ArgumentType>, E.SimpleApplication] {
    return [ this.get('types'), this.get('func') ];
  }
}

export function map(implementations: Impl[]): OverloadMap {
  const typeImplPair = implementations.map(i => i.toPair());
  return Map<List<ArgumentType>, E.SimpleApplication>(typeImplPair);
}

// ----------------------------------------------------------------------------
// Literal Construction helpers
// ----------------------------------------------------------------------------

export function bool(val: boolean): E.BooleanLiteral {
  return new E.BooleanLiteral(val);
}

export function number(num: number, dt?: C.TypeURL): E.NumericLiteral {
  return new E.NumericLiteral(num, C.make(dt || TypeURL.XSD_FLOAT), undefined);
}

export function numberFromString(str: string, dt?: C.TypeURL): E.NumericLiteral {
  const num = Number(str);
  return new E.NumericLiteral(num, C.make(dt || TypeURL.XSD_FLOAT), undefined);
}

export function string(str: string): E.StringLiteral {
  return new E.StringLiteral(str);
}

export function langString(str: string, lang: string) {
  return new E.LangStringLiteral(str, lang);
}

export function dateTime(date: Date, str: string): E.DateTimeLiteral {
  return new E.DateTimeLiteral(date, str);
}

// ----------------------------------------------------------------------------
// Util
// ----------------------------------------------------------------------------

export function log<T>(val: T, ...args: any[]): T {
  console.log(val, args);
  return val;
}

export function typeCheckLit<T>(
  term: E.TermExpression,
  allowed: ArgumentType[],
  args: E.Expression[],
  op: C.Operator,
): E.Literal<T> {
  if (term.termType !== 'literal') {
    throw new Err.InvalidArgumentTypes(args, op);
  }

  const lit = term as E.Literal<any>;

  if (!allowed.includes(lit.type)) {
    throw new Err.InvalidArgumentTypes(args, op);
  }

  return lit;
}
