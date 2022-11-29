import type * as RDF from '@rdfjs/types';
import type * as LRUCache from 'lru-cache';
import type * as E from '../../expressions';
import { expressionToVar } from '../../functions/Helpers';
import type { OverLoadCache } from '../../functions/OverloadTree';
import type { ITermTransformer } from '../../transformers/TermTransformer';
import * as Err from '../../util/Errors';
import type { SuperTypeCallback, TypeCache, ISuperTypeProvider } from '../../util/TypeHandling';

export interface ISharedContext {
  now?: Date;
  baseIRI?: string;
  /**
   * @deprecated Deprecated since version ... provided value will be ignored.
   */
  overloadCache?: LRUCache<string, any>;
  typeCache?: TypeCache;
  getSuperType?: SuperTypeCallback;
  /**
   * @deprecated Deprecated since version ... . The type 'experimental' system is always used.
   */
  enableExtendedXsdTypes?: boolean;
}

export interface ICompleteSharedContext {
  now: Date;
  baseIRI?: string;
  overloadCache: OverLoadCache;
  superTypeProvider: ISuperTypeProvider;
}

export class BaseExpressionEvaluator {
  public constructor(protected readonly termTransformer: ITermTransformer) { }

  protected term(expr: E.Term, mapping: RDF.Bindings): E.Term {
    return expr;
  }

  protected variable(expr: E.Variable, mapping: RDF.Bindings): E.Term {
    const term = mapping.get(expressionToVar(expr));
    if (!term) {
      throw new Err.UnboundVariableError(expr.name, mapping);
    }
    return this.termTransformer.transformRDFTermUnsafe(term);
  }
}
