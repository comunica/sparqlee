import type { Algebra } from 'sparqlalgebrajs';
import type { Bindings } from '../Types';
import { BaseAggregateEvaluator } from './BaseAggregateEvaluator';
import type { SyncEvaluatorConfig } from './SyncEvaluator';
import { SyncEvaluator } from './SyncEvaluator';

// TODO: Support hooks & change name to SyncAggregateEvaluator
export class AggregateEvaluator extends BaseAggregateEvaluator {
  private readonly evaluator: SyncEvaluator;

  constructor(expr: Algebra.AggregateExpression, config?: SyncEvaluatorConfig, throwError?: boolean) {
    super(expr, throwError);
    this.evaluator = new SyncEvaluator(expr.expression, config);
  }

  put(bindings: Bindings): void {
    this.init(bindings);
  }

  protected __put(bindings: Bindings): void {
    try {
      const term = this.evaluator.evaluate(bindings);
      this.state = this.aggregator.put(this.state, term);
    } catch (error) {
      this.safeThrow(error);
    }
  }

  protected safeThrow(err: Error): void {
    if (this.throwError) {
      throw err;
    } else {
      this.put = () => { };
      this.result = () => undefined;
    }
  }

  private init(start: Bindings): void {
    try {
      const startTerm = this.evaluator.evaluate(start);
      this.state = this.aggregator.init(startTerm);
      if (this.state) {
        this.put = this.__put;
        this.result = this.__result;
      }
    } catch (error) {
      this.safeThrow(error);
    }
  }
}

