import type * as RDF from '@rdfjs/types';
// eslint-disable-next-line no-redeclare
import { Map } from 'immutable';

export type Bindings = Map<string, RDF.Term>;

/**
 * A convenience constructor for bindings based on a given hash.
 * @param {{[p: string]: RDF.Term}} hash A hash that maps variable names to terms.
 * @return {Bindings} The immutable bindings from the hash.
 * @constructor
 */
// eslint-disable-next-line no-redeclare
export function Bindings(hash: Record<string, RDF.Term>): Bindings {
  return Map(hash);
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
