/**
 * These helpers provide a (albeit inflexible) DSL for writing function
 * definitions for the SPARQL functions.
 */
import * as E from '../expressions';
import type { Literal } from '../expressions';
import * as C from '../util/Consts';
import { TypeURL } from '../util/Consts';
import * as Err from '../util/Errors';
import type { ArgumentType } from './Core';
import { OverloadTree } from './OverloadTree';

type Term = E.TermExpression;

export function declare(): Builder {
  return new Builder();
}

export class Builder {
  private readonly overloadTree: OverloadTree;
  private collected: boolean;

  public constructor() {
    this.overloadTree = new OverloadTree();
    this.collected = false;
  }

  public collect(): OverloadTree {
    if (this.collected) {
      // Only 1 time allowed because we can't copy a tree. (And we don't need this).
      throw new Error('Builders can only be collected once!');
    }
    this.collected = true;
    return this.overloadTree;
  }

  public set(argTypes: ArgumentType[], func: E.SimpleApplication): Builder {
    this.overloadTree.addOverload(argTypes, func);
    return this;
  }

  public copy({ from, to }: { from: ArgumentType[]; to: ArgumentType[] }): Builder {
    const impl = this.overloadTree.getImplementationExact(from);
    if (!impl) {
      throw new Err.UnexpectedError(
        'Tried to copy implementation, but types not found',
        { from, to },
      );
    }
    return this.set(to, impl);
  }

  public onUnary<T extends Term>(type: ArgumentType, op: (val: T) => Term): Builder {
    return this.set([ type ], ([ val ]: [T]) => op(val));
  }

  public onUnaryTyped<T>(type: ArgumentType, op: (val: T) => Term): Builder {
    return this.set([ type ], ([ val ]: [E.Literal<T>]) => op(val.typedValue));
  }

  public onBinary<L extends Term, R extends Term>(types: ArgumentType[], op: (left: L, right: R) => Term): Builder {
    return this.set(types, ([ left, right ]: [L, R]) => op(left, right));
  }

  public onBinaryTyped<L, R>(types: ArgumentType[], op: (left: L, right: R) => Term): Builder {
    return this.set(types, ([ left, right ]: [E.Literal<L>, E.Literal<R>]) => op(left.typedValue, right.typedValue));
  }

  public onTernaryTyped<A1, A2, A3>(types: ArgumentType[], op: (a1: A1, a2: A2, a3: A3) => Term): Builder {
    return this.set(types, ([ a1, a2, a3 ]: [E.Literal<A1>, E.Literal<A2>, E.Literal<A3>]) =>
      op(a1.typedValue, a2.typedValue, a3.typedValue));
  }

  public onTernary<
    A1 extends Term,
    A2 extends Term,
    A3 extends Term
  >(types: ArgumentType[], op: (a1: A1, a2: A2, a3: A3) => Term): Builder {
    return this.set(types, ([ a1, a2, a3 ]: [A1, A2, A3]) => op(a1, a2, a3));
  }

  public onQuaternaryTyped<A1, A2, A3, A4>(types: ArgumentType[], op: (a1: A1, a2: A2, a3: A3, a4: A4) => Term):
  Builder {
    return this.set(types, ([ a1, a2, a3, a4 ]: [E.Literal<A1>, E.Literal<A2>, E.Literal<A3>, E.Literal<A4>]) =>
      op(a1.typedValue, a2.typedValue, a3.typedValue, a4.typedValue));
  }

  public onTerm1(op: (term: Term) => Term): Builder {
    return this.set([ 'term' ], ([ term ]: [Term]) => op(term));
  }

  public onLiteral1<T>(op: (lit: E.Literal<T>) => Term): Builder {
    return this.set([ 'literal' ], ([ term ]: [E.Literal<T>]) => op(term));
  }

  public onBoolean1(op: (lit: E.BooleanLiteral) => Term): Builder {
    return this
      .set([ C.TypeURL.XSD_BOOLEAN ], ([ lit ]: [E.BooleanLiteral]) => op(lit));
  }

  public onBoolean1Typed(op: (lit: boolean) => Term): Builder {
    return this
      .set([ C.TypeURL.XSD_BOOLEAN ], ([ lit ]: [E.BooleanLiteral]) => op(lit.typedValue));
  }

  public onString1(op: (lit: E.Literal<string>) => Term): Builder {
    return this
      .set([ C.TypeURL.XSD_STRING ], ([ lit ]: [E.Literal<string>]) => op(lit));
  }

  public onString1Typed(op: (lit: string) => Term): Builder {
    return this
      .set([ C.TypeURL.XSD_STRING ], ([ lit ]: [E.Literal<string>]) => op(lit.typedValue));
  }

  public onLangString1(op: (lit: E.LangStringLiteral) => Term): Builder {
    return this
      .set([ C.TypeURL.RDF_LANG_STRING ], ([ lit ]: [E.LangStringLiteral]) => op(lit));
  }

  public onStringly1(op: (lit: E.Literal<string>) => Term): Builder {
    return this
      .set([ C.TypeAlias.SPARQL_STRINGLY ], ([ lit ]: [E.Literal<string>]) => op(lit));
  }

  public onStringly1Typed(op: (lit: string) => Term): Builder {
    return this
      .set([ C.TypeAlias.SPARQL_STRINGLY ], ([ lit ]: [E.Literal<string>]) => op(lit.typedValue));
  }

  public onNumeric1(op: (val: E.NumericLiteral) => Term): Builder {
    return this
      .set([ C.TypeAlias.SPARQL_NUMERIC ], ([ val ]: [E.NumericLiteral]) => op(val))
      .invalidLexicalForm([ C.TypeAlias.SPARQL_NON_LEXICAL ], 1);
  }

  public onDateTime1(op: (date: E.DateTimeLiteral) => Term): Builder {
    return this
      .set([ C.TypeURL.XSD_DATE_TIME ], ([ val ]: [E.DateTimeLiteral]) => op(val))
      .invalidLexicalForm([ C.TypeAlias.SPARQL_NON_LEXICAL ], 1);
  }

  /**
   * !!! Be aware when using this function, it will create different overloads with diffrent return types !!!
   * Arithmetic operators take 2 numeric arguments, and return a single numerical
   * value. The type of the return value is heavily dependant on the types of the
   * input arguments. In JS everything is a double, but in SPARQL it is not.
   *
   * The different arguments are handled by type promotion and subtype substitution.
   * The way numeric function arguments work is described here:
   * https://www.w3.org/TR/xpath20/#mapping
   * Above url is referenced in the sparql spec: https://www.w3.org/TR/sparql11-query/#OperatorMapping
   */
  public arithmetic(op: (left: number, right: number) => number): Builder {
    const evalHelper = (left: Term, right: Term): number =>
      op((<Literal<number>>left).typedValue, (<Literal<number>>right).typedValue);
    return this.onBinary([ TypeURL.XSD_INTEGER, TypeURL.XSD_INTEGER ], (left, right) =>
      number(evalHelper(left, right), TypeURL.XSD_INTEGER))
      .onBinary([ TypeURL.XSD_DECIMAL, TypeURL.XSD_DECIMAL ], (left, right) =>
        number(evalHelper(left, right), TypeURL.XSD_DECIMAL))
      .onBinary([ TypeURL.XSD_FLOAT, TypeURL.XSD_FLOAT ], (left, right) =>
        number(evalHelper(left, right), TypeURL.XSD_FLOAT))
      .onBinary([ TypeURL.XSD_DOUBLE, TypeURL.XSD_DOUBLE ], (left, right) =>
        number(evalHelper(left, right), TypeURL.XSD_DOUBLE));
  }

  public numberTest(test: (left: number, right: number) => boolean): Builder {
    return this.numeric(([ left, right ]: E.NumericLiteral[]) => {
      const result = test(left.typedValue, right.typedValue);
      return bool(result);
    });
  }

  public stringTest(test: (left: string, right: string) => boolean): Builder {
    return this
      .set(
        [ C.TypeURL.XSD_STRING, C.TypeURL.XSD_STRING ],
        ([ left, right ]: E.StringLiteral[]) => {
          const result = test(left.typedValue, right.typedValue);
          return bool(result);
        },
      )
      .invalidLexicalForm([ C.TypeAlias.SPARQL_NON_LEXICAL, C.TypeURL.XSD_STRING ], 1)
      .invalidLexicalForm([ C.TypeURL.XSD_STRING, C.TypeAlias.SPARQL_NON_LEXICAL ], 2);
  }

  public booleanTest(test: (left: boolean, right: boolean) => boolean): Builder {
    return this
      .set(
        [ C.TypeURL.XSD_BOOLEAN, C.TypeURL.XSD_BOOLEAN ],
        ([ left, right ]: E.BooleanLiteral[]) => {
          const result = test(left.typedValue, right.typedValue);
          return bool(result);
        },
      )
      .invalidLexicalForm([ C.TypeAlias.SPARQL_NON_LEXICAL, C.TypeURL.XSD_BOOLEAN ], 1)
      .invalidLexicalForm([ C.TypeURL.XSD_BOOLEAN, C.TypeAlias.SPARQL_NON_LEXICAL ], 2);
  }

  public dateTimeTest(test: (left: Date, right: Date) => boolean): Builder {
    return this
      .set(
        [ C.TypeURL.XSD_DATE_TIME, C.TypeURL.XSD_DATE_TIME ],
        ([ left, right ]: E.DateTimeLiteral[]) => {
          const result = test(left.typedValue, right.typedValue);
          return bool(result);
        },
      )
      .invalidLexicalForm([ C.TypeAlias.SPARQL_NON_LEXICAL, C.TypeURL.XSD_DATE_TIME ], 1)
      .invalidLexicalForm([ C.TypeURL.XSD_DATE_TIME, C.TypeAlias.SPARQL_NON_LEXICAL ], 2);
  }

  public numeric(op: E.SimpleApplication): Builder {
    return this
      .set([ C.TypeAlias.SPARQL_NUMERIC, C.TypeAlias.SPARQL_NUMERIC ], op)
      .invalidLexicalForm([ C.TypeAlias.SPARQL_NUMERIC, C.TypeAlias.SPARQL_NON_LEXICAL ], 2)
      .invalidLexicalForm([ C.TypeAlias.SPARQL_NON_LEXICAL, C.TypeAlias.SPARQL_NUMERIC ], 1);
  }

  public invalidLexicalForm(types: ArgumentType[], index: number): Builder {
    return this.set(types, (args: Term[]): E.TermExpression => {
      throw new Err.InvalidLexicalForm(args[index - 1].toRDF());
    });
  }
}

// ----------------------------------------------------------------------------
// Literal Construction helpers
// ----------------------------------------------------------------------------

export function bool(val: boolean): E.BooleanLiteral {
  return new E.BooleanLiteral(val);
}

export function number(num: number, dt?: C.LiteralTypes): E.NumericLiteral {
  return new E.NumericLiteral(num, dt || TypeURL.XSD_FLOAT, undefined);
}

export function numberFromString(str: string, dt?: C.LiteralTypes): E.NumericLiteral {
  const num = Number(str);
  return new E.NumericLiteral(num, dt || TypeURL.XSD_FLOAT, undefined);
}

export function string(str: string): E.StringLiteral {
  return new E.StringLiteral(str);
}

export function langString(str: string, lang: string): E.LangStringLiteral {
  return new E.LangStringLiteral(str, lang);
}

export function dateTime(date: Date, str: string): E.DateTimeLiteral {
  return new E.DateTimeLiteral(date, str);
}
