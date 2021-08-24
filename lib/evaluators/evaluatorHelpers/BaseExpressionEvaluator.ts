import type * as E from '../../expressions';
import type { OverLoadCache } from '../../functions/OverloadTree';
import type { ITermTransformer } from '../../transformers/TermTransformer';
import type { Bindings } from '../../Types';
import * as Err from '../../util/Errors';
import type { SuperTypeCallback, TypeCache, ISuperTypeProvider } from '../../util/TypeHandling';

export interface ISharedContext {
  now?: Date;
  baseIRI?: string;
  overloadCache?: OverLoadCache;
  typeCache?: TypeCache;
  getSuperType?: SuperTypeCallback;
}

export interface ICompleteSharedContext {
  now: Date;
  baseIRI?: string;
  overloadCache?: OverLoadCache;
  superTypeProvider: ISuperTypeProvider;
}

export class BaseExpressionEvaluator {
  public constructor(protected readonly termTransformer: ITermTransformer) { }

  protected term(expr: E.Term, mapping: Bindings): E.Term {
    return expr;
  }

  protected variable(expr: E.Variable, mapping: Bindings): E.Term {
    const term = mapping.get(expr.name);
    if (!term) {
      throw new Err.UnboundVariableError(expr.name, mapping);
    }
    return this.termTransformer.transformRDFTermUnsafe(term);
  }
}
