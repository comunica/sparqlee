import type * as LRUCache from 'lru-cache';
import type * as E from '../../expressions';
import type { ITermTransformer } from '../../transformers/TermTransformer';
import type { Bindings } from '../../Types';
import * as Err from '../../util/Errors';

export interface ISharedConfig {
  now?: Date;
  baseIRI?: string;
  overloadCache?: LRUCache<string, string>;
  typeCache?: LRUCache<string, string>;
  typeDiscoveryCallback?: (unknownType: string) => string;
}

export interface ICompleteSharedConfig {
  now: Date;
  baseIRI?: string;
  overloadCache?: LRUCache<string, string>;
  typeCache: LRUCache<string, string>;
  typeDiscoveryCallback: (unknownType: string) => string;
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
