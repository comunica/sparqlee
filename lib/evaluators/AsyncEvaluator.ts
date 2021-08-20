import type * as RDF from '@rdfjs/types';
import * as LRUCache from 'lru-cache';
import type { Algebra as Alg } from 'sparqlalgebrajs';
import type * as E from '../expressions/Expressions';
import { AlgebraTransformer } from '../transformers/AlgebraTransformer';
import type { Bindings, IExpressionEvaluator } from '../Types';
import type { ICompleteAsyncEvaluatorConfig } from './evaluatorHelpers/AsyncRecursiveEvaluator';
import { AsyncRecursiveEvaluator } from './evaluatorHelpers/AsyncRecursiveEvaluator';
import type { ISharedConfig } from './evaluatorHelpers/BaseExpressionEvaluator';

export type AsyncExtensionFunction = (args: RDF.Term[]) => Promise<RDF.Term>;
export type AsyncExtensionFunctionCreator = (functionNamedNode: RDF.NamedNode) => AsyncExtensionFunction | undefined;

export interface IAsyncEvaluatorConfig extends ISharedConfig {
  exists?: (expression: Alg.ExistenceExpression, mapping: Bindings) => Promise<boolean>;
  aggregate?: (expression: Alg.AggregateExpression) => Promise<RDF.Term>;
  bnode?: (input?: string) => Promise<RDF.BlankNode>;
  extensionFunctionCreator?: AsyncExtensionFunctionCreator;
}

export class AsyncEvaluator {
  private readonly expr: E.Expression;
  private readonly evaluator: IExpressionEvaluator<E.Expression, Promise<E.TermExpression>>;

  public static setDefaultsFromConfig(config: IAsyncEvaluatorConfig): ICompleteAsyncEvaluatorConfig {
    return {
      now: config.now || new Date(Date.now()),
      baseIRI: config.baseIRI || undefined,
      overloadCache: config.overloadCache,
      typeCache: config.typeCache || new LRUCache(),
      typeDiscoveryCallback: config.typeDiscoveryCallback || (() => 'term'),
      exists: config.exists,
      aggregate: config.aggregate,
      bnode: config.bnode,
    };
  }

  public constructor(public algExpr: Alg.Expression, config: IAsyncEvaluatorConfig = {}) {
    // eslint-disable-next-line unicorn/no-useless-undefined
    const creator = config.extensionFunctionCreator || (() => undefined);
    const baseConfig = AsyncEvaluator.setDefaultsFromConfig(config);

    this.expr = new AlgebraTransformer({
      type: 'async',
      creator,
      ...baseConfig,
    }).transformAlgebra(algExpr);

    this.evaluator = new AsyncRecursiveEvaluator(baseConfig);
  }

  public async evaluate(mapping: Bindings): Promise<RDF.Term> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return result.toRDF();
  }

  public async evaluateAsEBV(mapping: Bindings): Promise<boolean> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return result.coerceEBV();
  }

  public async evaluateAsInternal(mapping: Bindings): Promise<E.TermExpression> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return result;
  }
}
