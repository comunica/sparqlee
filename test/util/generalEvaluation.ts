import type * as RDF from '@rdfjs/types';
import { termToString } from 'rdf-string';
import type { Algebra as Alg } from 'sparqlalgebrajs';
import { translate } from 'sparqlalgebrajs';
import type { IAsyncEvaluatorConfig, AsyncExtensionFunctionCreator } from '../../lib/evaluators/AsyncEvaluator';
import { AsyncEvaluator } from '../../lib/evaluators/AsyncEvaluator';
import type { ISyncEvaluatorConfig, SyncExtensionFunctionCreator } from '../../lib/evaluators/SyncEvaluator';
import { SyncEvaluator } from '../../lib/evaluators/SyncEvaluator';
import { Bindings } from '../../lib/Types';

export type GeneralEvaluationConfig = { type: 'sync'; config: ISyncEvaluatorConfig } |
{ type: 'async'; config: IAsyncEvaluatorConfig };

export interface IGeneralEvaluationArg {
  bindings?: Bindings;
  expression?: string;
  generalEvaluationConfig?: GeneralEvaluationConfig;
  /**
   * Boolean pointing out if the result of async and sync evaluation should be the same.
   * Default: Check / true
   */
  expectEquality?: boolean;
}

export async function generalEvaluate(arg: IGeneralEvaluationArg):
Promise<{ asyncResult: RDF.Term; syncResult?: RDF.Term }> {
  const bindings: Bindings = arg.bindings ? arg.bindings : Bindings({});
  if (arg.generalEvaluationConfig?.type === 'async') {
    return { asyncResult: await evaluateAsync(arg.expression, bindings, arg.generalEvaluationConfig.config) };
  }
  const asyncResult = await evaluateAsync(
    arg.expression,
    bindings,
    syncConfigToAsyncConfig(arg.generalEvaluationConfig?.config),
  );
  const syncResult = evaluateSync(arg.expression, bindings, arg.generalEvaluationConfig?.config);
  if (arg.expectEquality || arg.expectEquality === undefined) {
    expect(termToString(asyncResult)).toEqual(termToString(syncResult));
  }
  return { asyncResult, syncResult };
}

export async function generalErrorEvaluation(arg: IGeneralEvaluationArg):
Promise<{ asyncError: unknown; syncError?: unknown } | undefined > {
  const bindings: Bindings = arg.bindings ? arg.bindings : Bindings({});
  if (arg.generalEvaluationConfig?.type === 'async') {
    try {
      await evaluateAsync(arg.expression, bindings, arg.generalEvaluationConfig.config);
      return undefined;
    } catch (error: unknown) {
      return { asyncError: error };
    }
  }
  const res: { asyncError: unknown; syncError?: unknown } = Object.create(null);
  try {
    await evaluateAsync(
      arg.expression,
      bindings,
      syncConfigToAsyncConfig(arg.generalEvaluationConfig?.config),
    );
    return undefined;
  } catch (error: unknown) {
    res.asyncError = error;
  }
  try {
    evaluateSync(arg.expression, bindings, arg.generalEvaluationConfig?.config);
    return undefined;
  } catch (error: unknown) {
    res.syncError = error;
  }
  if (arg.expectEquality || arg.expectEquality === undefined) {
    expect(res.asyncError).toEqual(res.syncError);
  }
  return res;
}

function syncConfigToAsyncConfig(config: ISyncEvaluatorConfig | undefined): IAsyncEvaluatorConfig | undefined {
  if (!config) {
    return undefined;
  }
  const asyncExists = config.exists ? async(e: Alg.ExistenceExpression, m: Bindings) => config.exists(e, m) : undefined;
  const asyncAggregate = config.aggregate ?
    async(expression: Alg.AggregateExpression) => config.aggregate(expression) :
    undefined;
  const asyncBnode = config.bnode ? async(input?: string) => config.bnode(input) : undefined;
  const asyncExtensionFunctionCreator = syncCallbackWrapper(config.extensionFunctionCreator);
  return {
    ...config,
    exists: asyncExists,
    aggregate: asyncAggregate,
    bnode: asyncBnode,
    extensionFunctionCreator: asyncExtensionFunctionCreator,
  };
}

function syncCallbackWrapper(f: SyncExtensionFunctionCreator | undefined): AsyncExtensionFunctionCreator | undefined {
  if (!f)
  { return undefined; }
  return (namedNode: RDF.NamedNode) => async(args: RDF.Term[]) => f(namedNode)(args);
}

function parse(query: string) {
  const sparqlQuery = translate(query);
  // Extract filter expression from complete query
  return sparqlQuery.input.expression;
}

function evaluateAsync(expr: string, bindings: Bindings, config?: IAsyncEvaluatorConfig): Promise<RDF.Term> {
  const evaluator = new AsyncEvaluator(parse(expr), config);
  return evaluator.evaluate(bindings);
}

function evaluateSync(expr: string, bindings: Bindings, config?: ISyncEvaluatorConfig): RDF.Term {
  const evaluator = new SyncEvaluator(parse(expr), config);
  return evaluator.evaluate(bindings);
}
