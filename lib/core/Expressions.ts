import * as rdfjs from 'rdf-js';
import * as _ from 'lodash';
import { Algebra } from 'sparqlalgebrajs';

import { categorize, DataTypeCategory } from '../util/Consts';
import { Bindings } from '../FilteredStream';
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
  expressionType: 'aggregate'|'existence'|'named'|'operator'|'term'|'variable';
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
  name: rdfjs.NamedNode;
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
  termType: 'literal' | 'variable' ;
  coerceEBV(): boolean;
}

export interface VariableExpression extends Expression {
  expressionType: 'variable';
  name: string;
}

//==============================================================================

export class Variable implements VariableExpression {
    expressionType: 'variable' = 'variable';
    name: string;
    constructor(name: string){
        this.name = name;
    }
}

//==============================================================================

// Function and operator arguments are 'flattened' in the SPARQL spec.
// If the argument is a literal, the datatype often also matters.
export type ArgumentType = {
  termType: 'Literal' | 'NamedNode';
  literalType?: DataTypeCategory;
}


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
  ){
    if(args.length != this.arity) {
      throw new TypeError("Argument length not valid for function.");
    }
  }

  apply(args: TermExpression[]): TermExpression {
    if(this.arity != args.length || !this.isValidTypes(args)) {
      throw new TypeError("Argument types or length not valid for function.")
    }
    return this._apply(args);
  } 

  // TODO: Test
  isValidTypes(args: TermExpression[]): boolean {
    let argTypes = args.map((a: any) => { 
      return {termType: a.termType, literalType: a.category}
    });
    return _.isEqual(this.types, argTypes);
  }

  // protected abstract _apply(args: TermExpression[]): TermExpression;
}

// Operators like =, !=, <, ... are overloaded, and take varying kinds
// of argument types at the same time, like numbers, strings, and dates.
export type OverLoadMap = Map<
  [DataTypeCategory, DataTypeCategory],
  (left: TermExpression, right: TermExpression) => TermExpression
>;

export abstract class OverloadedOperator implements OperatorExpression {
  expressionType: 'operator' = 'operator';
  operatorClass: 'overloaded' = 'overloaded';
  left: Expression;
  right: Expression;

  // TODO: We could check arity beforehand
  constructor(
    public operator: string,
    public args: Expression[],
    private _overLoadMap: OverLoadMap) {
    
    // Only functions with arity 2 exist
    if(args.length != 2) {
      throw new TypeError("Argument length not valid for function.");
    }
    this.left = args[0], this.right = args[1];
  }

  apply(left: TermExpression, right: TermExpression): TermExpression {
    throw new UnimplementedError();
  } 
}

export type SpecialOperators = 'bound'| '||' | '&&';
export abstract class SpecialOperator implements OperatorExpression {
  expressionType: 'operator' = 'operator';
  operatorClass: 'special' = 'special';
  
  constructor(public operator: SpecialOperators, public args: Expression[]){

  }
}

//==============================================================================

export abstract class Term implements TermExpression {
    expressionType: 'term' = 'term';
    abstract termType: 'variable' | 'literal';

    coerceEBV(): boolean {
      throw new TypeError("Cannot coerce this term to EBV.");
    }
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
      public dataType?: rdfjs.NamedNode, 
      public language?: string) {
      super();
      this.category = categorize(dataType.value);
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

export class DateTimeLiteral extends Literal<Date> {}

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