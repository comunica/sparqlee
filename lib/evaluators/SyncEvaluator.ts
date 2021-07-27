import * as RDF from 'rdf-js';
import { Algebra as Alg } from 'sparqlalgebrajs';

import * as E from '../expressions/Expressions';

import { transformAlgebra } from '../Transformation';
import { Bindings, ExpressionEvaluator } from '../Types';

import { SyncRecursiveEvaluator } from './RecursiveExpressionEvaluator';
import {NamedNode} from 'rdf-js';

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
export type SyncExtensionFunctionCreator = (functionNamedNode: NamedNode) => SyncExtensionFunction | null;

export type SyncEvaluatorContext = SyncEvaluatorConfig & {
  now: Date;
};

export class SyncEvaluator {
  private expr: Expression;
  private evaluator: ExpressionEvaluator<Expression, Term>;

  constructor(public algExpr: Alg.Expression, public config: SyncEvaluatorConfig = {}) {
    const context: SyncEvaluatorContext = {
      now: config.now || new Date(Date.now()),
      bnode: config.bnode || undefined,
      baseIRI: config.baseIRI || undefined,
      exists: config.exists,
      aggregate: config.aggregate,
    };

    const extensionFunctionCreator = config.extensionFunctionCreator || (() => null);
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
  // console.log(val);
  return val;
}
