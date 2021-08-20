import type { Algebra } from 'sparqlalgebrajs';
import type { IApplyFunctionContext } from '../functions';
import type { Bindings } from '../Types';
import { BaseAggregateEvaluator } from './evaluatorHelpers/BaseAggregateEvaluator';
import type { ISyncEvaluatorConfig } from './SyncEvaluator';
import { SyncEvaluator } from './SyncEvaluator';

// TODO: Support hooks & change name to SyncAggregateEvaluator
export class AggregateEvaluator extends BaseAggregateEvaluator {
  private readonly evaluator: SyncEvaluator;

  private static getApplyFunctionConfig(config: ISyncEvaluatorConfig): IApplyFunctionContext {
    const { now, baseIRI, overloadCache, typeCache, typeDiscoveryCallback } =
      SyncEvaluator.setDefaultsFromConfig(config);
    return {
      functionContext: {
        now,
        baseIRI,
        openWorldType: { cache: typeCache,
          discoverer: typeDiscoveryCallback },
      },
      overloadCache,
    };
  }

  public constructor(expr: Algebra.AggregateExpression, config?: ISyncEvaluatorConfig, throwError?: boolean) {
    super(expr, AggregateEvaluator.getApplyFunctionConfig(config || {}), throwError);
    this.evaluator = new SyncEvaluator(expr.expression, config);
  }

  public put(bindings: Bindings): void {
    this.init(bindings);
  }

  protected __put(bindings: Bindings): void {
    try {
      const term = this.evaluator.evaluate(bindings);
      this.state = this.aggregator.put(this.state, term);
    } catch (error: unknown) {
      this.safeThrow(error);
    }
  }

  protected safeThrow(err: unknown): void {
    if (this.throwError) {
      throw err;
    } else {
      // eslint-disable-next-line @typescript-eslint/no-empty-function
      this.put = () => {};
      // eslint-disable-next-line unicorn/no-useless-undefined
      this.result = () => undefined;
    }
  }

  private init(start: Bindings): void {
    try {
      const startTerm = this.evaluator.evaluate(start);
      this.state = this.aggregator.init(startTerm);
      if (this.state) {
        this.put = this.__put.bind(this);
        this.result = this.__result.bind(this);
      }
    } catch (error: unknown) {
      this.safeThrow(error);
    }
  }
}

