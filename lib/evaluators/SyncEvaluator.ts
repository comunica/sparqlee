import type * as RDF from '@rdfjs/types';
import * as LRUCache from 'lru-cache';
import type { Algebra as Alg } from 'sparqlalgebrajs';
import type * as E from '../expressions/Expressions';
import { AlgebraTransformer } from '../transformers/AlgebraTransformer';
import type { Bindings, IExpressionEvaluator } from '../Types';
import type { ISharedConfig } from './evaluatorHelpers/BaseExpressionEvaluator';
import type { ICompleteSyncEvaluatorConfig } from './evaluatorHelpers/SyncRecursiveEvaluator';
import { SyncRecursiveEvaluator } from './evaluatorHelpers/SyncRecursiveEvaluator';

export interface ISyncEvaluatorConfig extends ISharedConfig {
  exists?: (expression: Alg.ExistenceExpression, mapping: Bindings) => boolean;
  aggregate?: (expression: Alg.AggregateExpression) => RDF.Term;
  bnode?: (input?: string) => RDF.BlankNode;
  extensionFunctionCreator?: SyncExtensionFunctionCreator;
}

export type SyncExtensionFunction = (args: RDF.Term[]) => RDF.Term;
export type SyncExtensionFunctionCreator = (functionNamedNode: RDF.NamedNode) => SyncExtensionFunction | undefined;

export class SyncEvaluator {
  private readonly expr: E.Expression;
  private readonly evaluator: IExpressionEvaluator<E.Expression, E.TermExpression>;

  public static setDefaultsFromConfig(config: ISyncEvaluatorConfig): ICompleteSyncEvaluatorConfig {
    return {
      now: config.now || new Date(Date.now()),
      baseIRI: config.baseIRI || undefined,
      overloadCache: config.overloadCache,
      typeCache: config.typeCache || new LRUCache(),
      superTypeDiscoverCallback: config.superTypeDiscoverCallback || (() => 'term'),
      exists: config.exists,
      aggregate: config.aggregate,
      bnode: config.bnode,
    };
  }

  public constructor(public algExpr: Alg.Expression, public config: ISyncEvaluatorConfig = {}) {
    // eslint-disable-next-line unicorn/no-useless-undefined
    const creator = config.extensionFunctionCreator || (() => undefined);
    const baseConfig = SyncEvaluator.setDefaultsFromConfig(config);

    this.expr = new AlgebraTransformer({
      type: 'sync',
      creator,
      ...baseConfig,
    }).transformAlgebra(algExpr);

    this.evaluator = new SyncRecursiveEvaluator(baseConfig);
  }

  public evaluate(mapping: Bindings): RDF.Term {
    const result = this.evaluator.evaluate(this.expr, mapping);
    return result.toRDF();
  }

  public evaluateAsEBV(mapping: Bindings): boolean {
    const result = this.evaluator.evaluate(this.expr, mapping);
    return result.coerceEBV();
  }

  public evaluateAsInternal(mapping: Bindings): E.TermExpression {
    const result = this.evaluator.evaluate(this.expr, mapping);
    return result;
  }
}
