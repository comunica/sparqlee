import { Algebra } from 'sparqlalgebrajs';
import * as rdfjs from 'rdf-js';
import { categorize, DataTypeCategory } from '../util/Consts';
import { NamedNode } from 'rdf-js';

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
}

export interface TermExpression extends Expression {
  expressionType: 'term';
  termType: string;
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

export abstract class Term implements TermExpression {
    expressionType: 'term' = 'term';
    abstract termType: string;

    coerceEBV(): boolean {
      throw new TypeError("Cannot coerce this term to EBV.");
    }
}


export interface LiteralTerm extends TermExpression {
  category: DataTypeCategory;
}

export class Literal<T> extends Term implements LiteralTerm {
    expressionType: 'term' = 'term';
    termType = 'literal';
    strValue: string;
    category: DataTypeCategory;
    typedValue: T;
    dataType?: NamedNode;
    language?: string;

    constructor(strValue: string, typedValue: T, dataType?: NamedNode, lang?: string) {
      super();
      this.dataType = dataType;
      this.strValue = strValue;
      this.typedValue = typedValue;
      this.language = lang;
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