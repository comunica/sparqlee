import type * as RDF from 'rdf-js';
import type { NamedNode } from 'rdf-js';
import type { Algebra as Alg } from 'sparqlalgebrajs';

import type * as E from '../expressions/Expressions';

import { transformAlgebra } from '../Transformation';
import type { Bindings, ExpressionEvaluator } from '../Types';

import { SyncRecursiveEvaluator } from './RecursiveExpressionEvaluator';

type Expression = E.Expression;
type Term = E.TermExpression;

export interface SyncEvaluatorConfig {
  now?: Date;
  baseIRI?: string;

  exists?: (expression: Alg.ExistenceExpression, mapping: Bindings) => boolean;
  aggregate?: (expression: Alg.AggregateExpression) => RDF.Term;
  bnode?: (input?: string) => RDF.BlankNode;
  extensionFunctionCreator?: SyncExtensionFunctionCreator;
}

export type SyncExtensionFunction = (args: RDF.Term[]) => RDF.Term;
export type SyncExtensionFunctionCreator = (functionNamedNode: NamedNode) => SyncExtensionFunction | undefined;

export type SyncEvaluatorContext = SyncEvaluatorConfig & {
  now: Date;
};

export class SyncEvaluator {
  private readonly expr: Expression;
  private readonly evaluator: ExpressionEvaluator<Expression, Term>;

  constructor(public algExpr: Alg.Expression, public config: SyncEvaluatorConfig = {}) {
    const context: SyncEvaluatorContext = {
      now: config.now || new Date(Date.now()),
      bnode: config.bnode || undefined,
      baseIRI: config.baseIRI || undefined,
      exists: config.exists,
      aggregate: config.aggregate,
    };

    const extensionFunctionCreator = config.extensionFunctionCreator || (() => undefined);
    this.expr = transformAlgebra(algExpr, { type: 'sync', creator: extensionFunctionCreator });
    this.evaluator = new SyncRecursiveEvaluator(context);
  }

  evaluate(mapping: Bindings): RDF.Term {
    const result = this.evaluator.evaluate(this.expr, mapping);
    return log(result).toRDF();
  }

  evaluateAsEBV(mapping: Bindings): boolean {
    const result = this.evaluator.evaluate(this.expr, mapping);
    return log(result).coerceEBV();
  }

  evaluateAsInternal(mapping: Bindings): Term {
    const result = this.evaluator.evaluate(this.expr, mapping);
    return log(result);
  }
}

function log<T>(val: T): T {
  // Console.log(val);
  return val;
}
