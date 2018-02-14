import { Algebra } from 'sparqlalgebrajs';
import * as rdfjs from 'rdf-js';
import { categorize, DataTypeCategory } from '../util/Consts';
import { NamedNode } from 'rdf-js';


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
}

export interface VariableExpression extends Expression {
  expressionType: 'variable';
  name: string;
}

//==============================================================================


export interface LiteralTerm extends TermExpression {
  category: DataTypeCategory;
}

export class Literal<T> implements LiteralTerm {
    expressionType: 'term' = 'term';
    termType = 'literal';
    strValue: string;
    category: DataTypeCategory;
    typedValue: T;
    dataType?: NamedNode;
    language?: string;

    constructor(strValue: string, typedValue: T, dataType?: NamedNode, lang?: string) {
      this.dataType = dataType;
      this.strValue = strValue;
      this.typedValue = typedValue;
      this.language = lang;
      this.category = categorize(dataType.value);
    }
}