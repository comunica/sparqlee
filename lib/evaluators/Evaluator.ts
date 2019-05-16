import * as RDF from 'rdf-js';
import { Algebra as Alg } from 'sparqlalgebrajs';

import * as E from '../expressions/Expressions';

import { transformAlgebra } from '../Transformation';
import { Bindings, ExpressionEvaluator, Hooks } from '../Types';

import { AsyncRecursiveEvaluator, SyncRecursiveEvaluator } from './RecursiveExpressionEvaluator';

type Expression = E.Expression;
type Term = E.TermExpression;

export class Evaluator {
  private expr: Expression;
  private evaluator: ExpressionEvaluator<Expression, Promise<Term>>;
  private evaluatorSync: ExpressionEvaluator<Expression, Term>;

  constructor(public algExpr: Alg.Expression, public hooks: Hooks = {}) {
    this.expr = transformAlgebra(algExpr, hooks);
    this.evaluator = new AsyncRecursiveEvaluator();
    this.evaluatorSync = new SyncRecursiveEvaluator();
  }

  // Async API ----------------------------------------------------------------

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

  // Sync API -----------------------------------------------------------------

  evaluateSync(mapping: Bindings): RDF.Term {
    const result = this.evaluatorSync.evaluate(this.expr, mapping);
    return log(result).toRDF();
  }

  evaluateAsEBVSync(mapping: Bindings): boolean {
    const result = this.evaluatorSync.evaluate(this.expr, mapping);
    return log(result).coerceEBV();
  }

  evaluateAsInternalSync(mapping: Bindings): Term {
    const result = this.evaluatorSync.evaluate(this.expr, mapping);
    return log(result);
  }
}

function log<T>(val: T): T {
  // console.log(val);
  return val;
}
