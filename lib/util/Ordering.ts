import type * as RDF from '@rdfjs/types';
import * as LRUCache from 'lru-cache';
import type { LangStringLiteral } from '../expressions';
import { TermTransformer } from '../transformers/TermTransformer';
import { TypeAlias, TypeURL } from './Consts';
import type { ISuperTypeProvider, SuperTypeCallback, TypeCache } from './TypeHandling';
import { isSubTypeOf } from './TypeHandling';

// Determine the relative numerical order of the two given terms.
/**
 * @param enableExtendedXSDTypes deprecated since version ... . System will behave like when this was true.
 */
export function orderTypes(termA: RDF.Term | undefined, termB: RDF.Term | undefined, isAscending: boolean,
  typeDiscoveryCallback?: SuperTypeCallback, typeCache?: TypeCache, enableExtendedXSDTypes?: boolean): -1 | 0 | 1 {
  if (termA === termB) {
    return 0;
  }

  // We handle undefined that is lower than everything else.
  if (termA === undefined) {
    return isAscending ? -1 : 1;
  }
  if (termB === undefined) {
    return isAscending ? 1 : -1;
  }

  // We handle terms
  if (termA.equals(termB)) {
    return 0;
  }
  return isTermLowerThan(termA, termB, typeDiscoveryCallback, typeCache, enableExtendedXSDTypes) === isAscending ?
    -1 :
    1;
}

function isTermLowerThan(termA: RDF.Term, termB: RDF.Term,
  typeDiscoveryCallback?: SuperTypeCallback, typeCache?: TypeCache, enableExtendedXSDTypes?: boolean): boolean {
  if (termA.termType !== termB.termType) {
    return _TERM_ORDERING_PRIORITY[termA.termType] < _TERM_ORDERING_PRIORITY[termB.termType];
  }
  return termA.termType === 'Literal' ?
    isLiteralLowerThan(termA, <RDF.Literal>termB, typeDiscoveryCallback, typeCache) :
    termA.value < termB.value;
}

function isLiteralLowerThan(litA: RDF.Literal, litB: RDF.Literal,
  typeDiscoveryCallback?: SuperTypeCallback, typeCache?: TypeCache): boolean {
  const openWorldType: ISuperTypeProvider = {
    discoverer: typeDiscoveryCallback || (() => 'term'),
    cache: typeCache || new LRUCache(),
  };
  const termTransformer = new TermTransformer(openWorldType);
  const myLitA = termTransformer.transformLiteral(litA);
  const myLitB = termTransformer.transformLiteral(litB);
  const typeA = myLitA.dataType;
  const typeB = myLitB.dataType;
  if (isSubTypeOf(typeA, TypeURL.XSD_BOOLEAN, openWorldType) &&
        isSubTypeOf(typeB, TypeURL.XSD_BOOLEAN, openWorldType) ||
      isSubTypeOf(typeA, TypeURL.XSD_DATE_TIME, openWorldType) &&
        isSubTypeOf(typeB, TypeURL.XSD_DATE_TIME, openWorldType) ||
      isSubTypeOf(typeA, TypeAlias.SPARQL_NUMERIC, openWorldType) &&
        isSubTypeOf(typeB, TypeAlias.SPARQL_NUMERIC, openWorldType) ||
      isSubTypeOf(typeA, TypeURL.XSD_STRING, openWorldType) &&
        isSubTypeOf(typeB, TypeURL.XSD_STRING, openWorldType)) {
    return myLitA.typedValue < myLitB.typedValue;
  }
  if (isSubTypeOf(typeA, TypeURL.RDF_LANG_STRING, openWorldType) &&
      isSubTypeOf(typeB, TypeURL.RDF_LANG_STRING, openWorldType)) {
    return myLitA.typedValue < myLitB.typedValue ||
      (myLitA.typedValue === myLitB.typedValue &&
        (<LangStringLiteral>myLitA).language < (<LangStringLiteral>myLitB).language);
  }
  return typeA < typeB || (myLitA.dataType === myLitB.dataType && myLitA.str() < myLitB.str());
}

// SPARQL specifies that blankNode < namedNode < literal.
const _TERM_ORDERING_PRIORITY = {
  Variable: 0,
  BlankNode: 1,
  NamedNode: 2,
  Literal: 3,
  Quad: 4,
  DefaultGraph: 5,
};
