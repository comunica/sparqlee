import * as RDF from 'rdf-js';
import {NamedNode} from 'rdf-js';
import {Algebra as Alg} from 'sparqlalgebrajs';

import * as E from '../expressions/Expressions';

import {transformAlgebra} from '../Transformation';
import {Bindings, ExpressionEvaluator} from '../Types';

import {AsyncRecursiveEvaluator} from './RecursiveExpressionEvaluator';
import {SyncExtensionFunctionCallback} from './SyncEvaluator';

type Expression = E.Expression;
type Term = E.TermExpression;

export type AsyncExtensionFunction = (args: RDF.Term[]) => Promise<RDF.Term>;
export type AsyncExtensionFunctionCallback = (functionNamedNode: NamedNode) => AsyncExtensionFunction;

export interface AsyncEvaluatorConfig {
  now?: Date;
  baseIRI?: string;

  exists?: (expression: Alg.ExistenceExpression, mapping: Bindings) => Promise<boolean>;
  aggregate?: (expression: Alg.AggregateExpression) => Promise<RDF.Term>;
  bnode?: (input?: string) => Promise<RDF.BlankNode>;
  extensionFunctionCallback?: AsyncExtensionFunctionCallback;
}

export type AsyncEvaluatorContext = AsyncEvaluatorConfig & {
  now: Date;
};

export class AsyncEvaluator {
  private expr: Expression;
  private evaluator: ExpressionEvaluator<Expression, Promise<Term>>;

  constructor(public algExpr: Alg.Expression, public config: AsyncEvaluatorConfig = {}) {
    const context = {
      now: config.now || new Date(Date.now()),
      bnode: config.bnode || undefined,
      baseIRI: config.baseIRI || undefined,
      exists: config.exists,
      aggregate: config.aggregate,
    };

    this.expr = transformAlgebra(algExpr, config.extensionFunctionCallback, false);

    this.evaluator = new AsyncRecursiveEvaluator(context);
  }

  async evaluate(mapping: Bindings): Promise<RDF.Term> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return log(result).toRDF();
  }

  async evaluateAsEBV(mapping: Bindings): Promise<boolean> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return log(result).coerceEBV();
  }

  async evaluateAsInternal(mapping: Bindings): Promise<Term> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return log(result);
  }
}

function log<T>(val: T): T {
  // console.log(val);
  return val;
}
