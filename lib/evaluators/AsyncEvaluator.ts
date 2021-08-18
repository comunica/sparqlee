import type * as RDF from '@rdfjs/types';
import * as LRUCache from 'lru-cache';
import type { Algebra as Alg } from 'sparqlalgebrajs';

import type * as E from '../expressions/Expressions';

import { transformAlgebra } from '../Transformation';
import type { Bindings, IExpressionEvaluator } from '../Types';
import type { IOpenWorldTyping } from '../util/TypeHandling';
import { AsyncRecursiveEvaluator } from './RecursiveExpressionEvaluator';

type Expression = E.Expression;
type Term = E.TermExpression;

export type AsyncExtensionFunction = (args: RDF.Term[]) => Promise<RDF.Term>;
export type AsyncExtensionFunctionCreator = (functionNamedNode: RDF.NamedNode) => AsyncExtensionFunction | undefined;

export interface IAsyncEvaluatorConfig {
  now?: Date;
  baseIRI?: string;

  exists?: (expression: Alg.ExistenceExpression, mapping: Bindings) => Promise<boolean>;
  aggregate?: (expression: Alg.AggregateExpression) => Promise<RDF.Term>;
  bnode?: (input?: string) => Promise<RDF.BlankNode>;
  extensionFunctionCreator?: AsyncExtensionFunctionCreator;
  overloadCache?: LRUCache<string, string>;
  typeCache?: LRUCache<string, string>;
  typeDiscoveryCallback?: (unknownType: string) => string;
}
const baseCacheOptions: LRUCache.Options<string, string> = {
  length(value: string, key?: string): number {
    return value.length;
  },
};

export type AsyncEvaluatorContext = IAsyncEvaluatorConfig & {
  now: Date;
};

export class AsyncEvaluator {
  private readonly expr: Expression;
  private readonly evaluator: IExpressionEvaluator<Expression, Promise<Term>>;

  public constructor(public algExpr: Alg.Expression, public config: IAsyncEvaluatorConfig = {}) {
    const context = {
      now: config.now || new Date(Date.now()),
      bnode: config.bnode || undefined,
      baseIRI: config.baseIRI || undefined,
      exists: config.exists,
      aggregate: config.aggregate,
    };

    const extensionFunctionCreator: AsyncExtensionFunctionCreator =
      // eslint-disable-next-line unicorn/no-useless-undefined
      config.extensionFunctionCreator || (() => undefined);
    const overloadCache = config.overloadCache || new LRUCache(baseCacheOptions);
    const openWorldTyping: IOpenWorldTyping = {
      cache: config.typeCache || new LRUCache(baseCacheOptions),
      discoverer: config.typeDiscoveryCallback || (() => 'term'),
    };
    this.expr = transformAlgebra(algExpr, { type: 'async', creator: extensionFunctionCreator }, openWorldTyping);

    this.evaluator = new AsyncRecursiveEvaluator(context);
  }

  public async evaluate(mapping: Bindings): Promise<RDF.Term> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return result.toRDF();
  }

  public async evaluateAsEBV(mapping: Bindings): Promise<boolean> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return result.coerceEBV();
  }

  public async evaluateAsInternal(mapping: Bindings): Promise<Term> {
    const result = await this.evaluator.evaluate(this.expr, mapping);
    return result;
  }
}
