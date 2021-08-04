import type * as RDF from 'rdf-js';
import type { Algebra } from 'sparqlalgebrajs';

import type { Bindings } from '../Types';

export enum ExpressionType {
  Aggregate = 'aggregate',
  Existence = 'existence',
  Named = 'named',
  Operator = 'operator',
  SpecialOperator = 'specialOperator',
  Term = 'term',
  Variable = 'variable',
  AsyncExtension = 'asyncExtension',
  SyncExtension = 'syncExtension',
}

export type Expression =
  AggregateExpression |
  ExistenceExpression |
  NamedExpression |
  OperatorExpression |
  SpecialOperatorExpression |
  TermExpression |
  VariableExpression |
  AsyncExtensionExpression |
  SyncExtensionExpression;

export interface ExpressionProps {
  expressionType: ExpressionType;
}

export type AggregateExpression = ExpressionProps & {
  expressionType: ExpressionType.Aggregate;
  name: string;
  expression: Algebra.AggregateExpression;
};

export type ExistenceExpression = ExpressionProps & {
  expressionType: ExpressionType.Existence;
  expression: Algebra.ExistenceExpression;
};

export type NamedExpression = ExpressionProps & {
  expressionType: ExpressionType.Named;
  name: RDF.NamedNode;
  apply: SimpleApplication;
  args: Expression[];
};

export type AsyncExtensionExpression = ExpressionProps & {
  expressionType: ExpressionType.AsyncExtension;
  name: RDF.NamedNode;
  apply: AsyncExtensionApplication;
  args: Expression[];
};

export type SyncExtensionExpression = ExpressionProps & {
  expressionType: ExpressionType.SyncExtension;
  name: RDF.NamedNode;
  apply: SimpleApplication;
  args: Expression[];
};

// Export type Application = SimpleApplication | SpecialApplication;
export type SimpleApplication = (args: TermExpression[]) => TermExpression;
export type AsyncExtensionApplication = (args: TermExpression[]) => Promise<TermExpression>;

export type OperatorExpression = ExpressionProps & {
  expressionType: ExpressionType.Operator;
  args: Expression[];
  apply: SimpleApplication;
};

export type SpecialApplication<Term, BNode> = (context: EvalContext<Term, BNode>) => Term;

export type SpecialApplicationAsync = SpecialApplication<Promise<TermExpression>, Promise<RDF.BlankNode>>;
export type EvalContextAsync = EvalContext<Promise<TermExpression>, Promise<RDF.BlankNode>>;

export type SpecialApplicationSync = SpecialApplication<TermExpression, RDF.BlankNode>;
export type EvalContextSync = EvalContext<TermExpression, RDF.BlankNode>;

export interface EvalContext<Term, BNode> {
  args: Expression[];
  mapping: Bindings;
  context: {
    now: Date;
    baseIRI?: string;
    bnode: (input?: string) => BNode;
  };
  evaluate: (expr: Expression, mapping: Bindings) => Term;
}

export type SpecialOperatorExpression = ExpressionProps & {
  expressionType: ExpressionType.SpecialOperator;
  args: Expression[];
  applyAsync: SpecialApplicationAsync;
  applySync: SpecialApplicationSync;
};

// TODO: Create alias Term = TermExpression
export type TermType = 'namedNode' | 'literal' | 'blankNode';
export type TermExpression = ExpressionProps & {
  expressionType: ExpressionType.Term;
  termType: TermType;
  str: () => string;
  coerceEBV: () => boolean;
  toRDF: () => RDF.Term;
};

export type VariableExpression = ExpressionProps & {
  expressionType: ExpressionType.Variable;
  name: string;
};
