import * as _ from 'lodash';
import * as RDFDM from 'rdf-data-model';
import * as RDF from 'rdf-js';
import { Algebra } from 'sparqlalgebrajs';

import { Bindings } from '../core/Bindings';
import { categorize, DataTypeCategory } from '../util/Consts';
import { UnimplementedError } from '../util/Errors';

export enum expressionTypes {
  AGGREGATE = 'aggregate',
  EXISTENCE = 'existence',
  NAMED = 'named',
  OPERATOR = 'operator',
  TERM = 'term',
  VARIABLE = 'variable',
}

export interface IExpression {
  expressionType: 'aggregate' | 'existence' | 'named' | 'operator' | 'term' | 'variable';
}

export interface IAggregateExpression extends IExpression {
  expressionType: 'aggregate';
  aggregator: string;
  distinct: boolean;
  separator?: string; // used by GROUP_CONCAT
  expression: IExpression;
}

export interface IExistenceExpression extends IExpression {
  expressionType: 'existence';
  not: boolean;
  input: Algebra.Operation;
}

export interface INamedExpression extends IExpression {
  expressionType: 'named';
  name: RDF.NamedNode;
  args: IExpression[];
}

export interface IOperatorExpression extends IExpression {
  expressionType: 'operator';
  operator: string;
  args: IExpression[];
  operatorClass: 'simple' | 'overloaded' | 'special';
  // apply(args: Expression[], mapping: Bindings): TermExpression;
}

export interface ITermExpression extends IExpression {
  expressionType: 'term';
  termType: 'literal' | 'variable';
  coerceEBV(): boolean;
  toRDF(): RDF.Term;
}

export interface IVariableExpression extends IExpression {
  expressionType: 'variable';
  name: string;
}

// -----------------------------------------------------------------------------

export class Variable implements IVariableExpression {
  public expressionType: 'variable' = 'variable';
  public name: string;
  constructor(name: string) {
    this.name = name;
  }
}

// -----------------------------------------------------------------------------

// Function and operator arguments are 'flattened' in the SPARQL spec.
// If the argument is a literal, the datatype often also matters.
export type ArgumentType = 'namedNode' | DataTypeCategory;

export class SimpleOperator implements IOperatorExpression {
  public expressionType: 'operator' = 'operator';
  public operatorClass: 'simple' = 'simple';

  // TODO: We could check arity beforehand
  constructor(
    public operator: string,
    public arity: number,
    public args: IExpression[],
    public types: ArgumentType[],
    protected _apply: (args: ITermExpression[]) => ITermExpression,
  ) {
    if (args.length !== this.arity) {
      throw new TypeError("Argument length not valid for function.");
    }
  }

  public apply(args: ITermExpression[]): ITermExpression {
    if (this.arity !== args.length) {
      throw new TypeError("Argument length not valid for function.")
    }
    if (!this._isValidTypes(args)) {
      throw new TypeError("Argument types not valid for function.")
    }
    return this._apply(args);
  }

  // TODO: Test
  private _isValidTypes(args: ITermExpression[]): boolean {
    const argTypes = args.map((a: any) => a.category || a.termType);
    return _.isEqual(this.types, argTypes);
  }

  // protected abstract _apply(args: TermExpression[]): TermExpression;
}

// Operators like =, !=, <, ... are overloaded, and take varying kinds
// of argument types, like numbers, strings, and dates.
// Note they don't take multiple types in the same call
export type OverloadMap = [
  ArgumentType[],
  (args: ITermExpression[]) => ITermExpression
][];

export class OverloadedOperator implements IOperatorExpression {
  public expressionType: 'operator' = 'operator';
  public operatorClass: 'overloaded' = 'overloaded';
  // We use strings as indexes here cause JS doesn't support arrays or objects
  // as keys (checks by reference), and tuples aren't a thing.
  private _overloadMap: Map<string, (args: ITermExpression[]) => ITermExpression>;

  // TODO: We could check arity beforehand
  constructor(
    public operator: string,
    public arity: number,
    public args: IExpression[],
    overloadMap: OverloadMap,
  ) {

    if (args.length !== this.arity) {
      throw new TypeError("Argument length not valid for function.");
    }
    const entries = overloadMap.map(([type, f]) => <any>[type.toString(), f]);
    this._overloadMap = new Map(entries);
  }

  public apply(args: ITermExpression[]): ITermExpression {
    const func = this._monomorph(args);
    if (!func) {
      throw new TypeError("Argument types not valid for function.")
    }
    return func(args);
  }

  // Fix this toString() BS, check Immutable.JS maps
  private _monomorph(args: ITermExpression[]): (args: ITermExpression[]) => ITermExpression {
    throw new UnimplementedError();
    const argTypes = args.map((a: any) => a.category || a.termType).toString();
    return this._overloadMap.get(argTypes);
  }
}

export type SpecialOperators = 'bound' | '||' | '&&';

export abstract class SpecialOperator implements IOperatorExpression {
  public expressionType: 'operator' = 'operator';
  public operatorClass: 'special' = 'special';

  constructor(public operator: SpecialOperators, public args: IExpression[]) { }
}

// ----------------------------------------------------------------------------

export abstract class Term implements ITermExpression {
  public expressionType: 'term' = 'term';
  public abstract termType: 'variable' | 'literal';

  public coerceEBV(): boolean {
    throw new TypeError("Cannot coerce this term to EBV.");
  }

  public abstract toRDF(): RDF.Term;
}

export interface ILiteralTerm extends ITermExpression {
  category: DataTypeCategory;
}

export class Literal<T> extends Term implements ILiteralTerm {
  public expressionType: 'term' = 'term';
  public termType: 'literal' = 'literal';
  public category: DataTypeCategory;

  constructor(
    public typedValue: T,
    public strValue?: string,
    public dataType?: RDF.NamedNode,
    public language?: string) {
    super();
    this.category = categorize(dataType.value);
  }

  public toRDF(): RDF.Term {
    return RDFDM.literal(
      this.strValue || this.typedValue.toString(),
      this.language || this.dataType);
  }
}

export class NumericLiteral extends Literal<number> {
  public coerceEBV(): boolean {
    return !!this.typedValue;
  }
}

export class BooleanLiteral extends Literal<boolean> {
  public coerceEBV(): boolean {
    return !!this.typedValue;
  }
}

export class DateTimeLiteral extends Literal<Date> { }

export class PlainLiteral extends Literal<string> {
  public coerceEBV(): boolean {
    return this.strValue.length !== 0;
  }
}

export class StringLiteral extends Literal<string> {
  public coerceEBV(): boolean {
    return this.strValue.length !== 0;
  }
}
