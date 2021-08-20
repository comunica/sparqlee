import type * as RDF from '@rdfjs/types';
import * as LRUCache from 'lru-cache';
import type * as T from '../expressions/Term';
import { TermTransformer } from '../transformers/TermTransformer';
import type { IOpenWorldEnabler, SuperTypeDiscoverCallback, TypeCache } from './TypeHandling';

// Determine the relative numerical order of the two given terms.
export function orderTypes(litA: RDF.Term | undefined, litB: RDF.Term | undefined, isAscending: boolean,
  typeDiscoveryCallback?: SuperTypeDiscoverCallback, typeCache?: TypeCache): -1 | 0 | 1 {
  const openWorldType: IOpenWorldEnabler = {
    discoverer: typeDiscoveryCallback || (() => 'term'),
    cache: typeCache || new LRUCache(),
  };
  const termTransformer = new TermTransformer(openWorldType);
  if (litA && litA.termType === 'Literal' && litB && litB.termType === 'Literal') {
    const myLitA = termTransformer.transformLiteral(litA);
    const myLitB = termTransformer.transformLiteral(litB);
    return order(myLitA, myLitB, isAscending);
  }
  return 0;
}

// Effective ordering
export function order(orderA: T.Literal<any>, orderB: T.Literal<any>, isAscending: boolean): -1 | 0 | 1 {
  if (orderA.typedValue === orderB.typedValue) {
    return 0;
  }
  return orderA.typedValue > orderB.typedValue === isAscending ? 1 : -1;
}
