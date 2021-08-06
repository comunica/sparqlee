import type * as RDF from 'rdf-js';

export type Bindings = Map<string, RDF.Term>;

/**
 * A convenience constructor for bindings based on a given hash.
 * @param {{[p: string]: RDF.Term}} hash A hash that maps variable names to terms.
 * @return {Bindings} The immutable bindings from the hash.
 * @constructor
 */
export function BindingsFromHash(hash: Record<string, RDF.Term>): Bindings {
  return new Map(Object.entries(hash));
}

export interface IExpressionEvaluator<ExpressionType, TermType> {
  evaluate: (expr: ExpressionType, mapping: Bindings) => TermType;
}

// Export type Hooks = {
//   existence?: ExistenceHook;
//   aggregate?: AggregateHook;
//   namedFunc?: NamedFuncHook;
// };

// // TODO: Document
// export type NamedFuncHook = (expression: Alg.NamedExpression) => Promise<RDF.Term>;
// export type AggregateHook = (expression: Alg.AggregateExpression) => Promise<RDF.Term>;
// export type ExistenceHook = (expression: Alg.ExistenceExpression, mapping: Bindings) => Promise<boolean>;
