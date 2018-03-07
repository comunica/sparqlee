import * as RDF from 'rdf-js';
import * as RDFDM from 'rdf-data-model';
import * as _ from 'lodash';
import { Algebra } from 'sparqlalgebrajs';

import { categorize, DataTypeCategory } from '../util/Consts';
import { Bindings } from '../core/Bindings';
import { UnimplementedError } from '../util/Errors';

export enum expressionTypes {
  AGGREGATE = 'aggregate',
  EXISTENCE = 'existence',
  NAMED = 'named',
  OPERATOR = 'operator',
  TERM = 'term',
  VARIABLE = 'variable'
}

export interface Expression {
  expressionType: 'aggregate' | 'existence' | 'named' | 'operator' | 'term' | 'variable';
}

export interface AggregateExpression extends Expression {
  expressionType: 'aggregate',
  aggregator: string;
  distinct: boolean;
  separator?: string; // used by GROUP_CONCAT
  expression: Expression;
}

export interface ExistenceExpression extends Expression {
  expressionType: 'existence';
  not: boolean;
  input: Algebra.Operation;
}

export interface NamedExpression extends Expression {
  expressionType: 'named';
  name: RDF.NamedNode;
  args: Expression[];
}

export interface OperatorExpression extends Expression {
  expressionType: 'operator';
  operator: string;
  args: Expression[];
  operatorClass: 'simple' | 'overloaded' | 'special';
  // apply(args: Expression[], mapping: Bindings): TermExpression;
}

export interface TermExpression extends Expression {
  expressionType: 'term';
  termType: 'literal' | 'variable';
  coerceEBV(): boolean;
  toRDF(): RDF.Term;
}

export interface VariableExpression extends Expression {
  expressionType: 'variable';
  name: string;
}

//==============================================================================

export class Variable implements VariableExpression {
  expressionType: 'variable' = 'variable';
  name: string;
  constructor(name: string) {
    this.name = name;
  }
}

//==============================================================================

// Function and operator arguments are 'flattened' in the SPARQL spec.
// If the argument is a literal, the datatype often also matters.
export type ArgumentType = 'namedNode' | DataTypeCategory;

export class SimpleOperator implements OperatorExpression {
  expressionType: 'operator' = 'operator';
  operatorClass: 'simple' = 'simple';

  // TODO: We could check arity beforehand
  constructor(
    public operator: string,
    public arity: number,
    public args: Expression[],
    public types: ArgumentType[],
    protected _apply: (args: TermExpression[]) => TermExpression
  ) {
    if (args.length != this.arity) {
      throw new TypeError("Argument length not valid for function.");
    }
  }

  apply(args: TermExpression[]): TermExpression {
    if (this.arity != args.length) {
      throw new TypeError("Argument length not valid for function.")
    }
    if (!this.isValidTypes(args)) {
      throw new TypeError("Argument types not valid for function.")
    }
    return this._apply(args);
  }

  // TODO: Test
  isValidTypes(args: TermExpression[]): boolean {
    let argTypes = args.map((a: any) => a.category || a.termType);
    return _.isEqual(this.types, argTypes);
  }

  // protected abstract _apply(args: TermExpression[]): TermExpression;
}

// Operators like =, !=, <, ... are overloaded, and take varying kinds
// of argument types, like numbers, strings, and dates.
// Note they don't take multiple types in the same call
export type OverloadMap = [
  ArgumentType[],
  (args: TermExpression[]) => TermExpression
][];

export class OverloadedOperator implements OperatorExpression {
  expressionType: 'operator' = 'operator';
  operatorClass: 'overloaded' = 'overloaded';
  // We use strings as indexes here cause JS doesn't support arrays or objects
  // as keys (checks by reference), and tuples aren't a thing.
  _overloadMap: Map<string, (args: TermExpression[]) => TermExpression>

  // TODO: We could check arity beforehand
  constructor(
    public operator: string,
    public arity: number,
    public args: Expression[],
    overloadMap: OverloadMap) {

    if (args.length != this.arity) {
      throw new TypeError("Argument length not valid for function.");
    }
    let entries = overloadMap.map(([type, f]) => <any>[type.toString(), f])
    this._overloadMap = new Map(entries);
  }

  apply(args: TermExpression[]): TermExpression {
    let func = this._monomorph(args);
    if (!func) {
      throw new TypeError("Argument types not valid for function.")
    }
    return func(args);
  }

  _monomorph(args: TermExpression[]): (args: TermExpression[]) => TermExpression {
    let argTypes = args.map((a: any) => a.category || a.termType).toString();
    return this._overloadMap.get(argTypes);
  }
}

export type SpecialOperators = 'bound' | '||' | '&&';
export abstract class SpecialOperator implements OperatorExpression {
  expressionType: 'operator' = 'operator';
  operatorClass: 'special' = 'special';

  constructor(public operator: SpecialOperators, public args: Expression[]) {

  }
}

//==============================================================================

export abstract class Term implements TermExpression {
  expressionType: 'term' = 'term';
  abstract termType: 'variable' | 'literal';

  coerceEBV(): boolean {
    throw new TypeError("Cannot coerce this term to EBV.");
  }

  abstract toRDF(): RDF.Term;
}


export interface LiteralTerm extends TermExpression {
  category: DataTypeCategory;
}

export class Literal<T> extends Term implements LiteralTerm {
  expressionType: 'term' = 'term';
  termType: 'literal' = 'literal';
  category: DataTypeCategory;

  constructor(
    public typedValue: T,
    public strValue?: string,
    public dataType?: RDF.NamedNode,
    public language?: string) {
    super();
    this.category = categorize(dataType.value);
  }

  toRDF(): RDF.Term {
    return RDFDM.literal(
      this.strValue || this.typedValue.toString(),
      this.language || this.dataType);
  }
}

export class NumericLiteral extends Literal<number> {
  coerceEBV(): boolean {
    return !!this.typedValue;
  }
}

export class BooleanLiteral extends Literal<boolean> {
  coerceEBV(): boolean {
    return !!this.typedValue;
  }
}

export class DateTimeLiteral extends Literal<Date> { }

export class PlainLiteral extends Literal<string> {
  coerceEBV(): boolean {
    return this.strValue.length != 0
  }
}

export class StringLiteral extends Literal<string> {
  coerceEBV(): boolean {
    return this.strValue.length != 0
  }
}