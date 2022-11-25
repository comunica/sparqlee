import type * as RDF from '@rdfjs/types';
import { DataFactory } from 'rdf-data-factory';

import * as E from '../expressions';
import { TermTransformer } from '../transformers/TermTransformer';
import * as C from '../util/Consts';
import type { IOverloadedDefinition } from './Core';
import { bool, declare } from './Helpers';

const DF = new DataFactory<RDF.BaseQuad>();

/**
 * https://w3c.github.io/rdf-star/cg-spec/editors_draft.html#triple-function
 */
const triple = {
  arity: 3,
  overloads: declare(C.SparqlStarOperator.TRIPLE)
    .onTernaryTyped<E.Term, E.Term, E.Term>(
    [ 'term', 'term', 'term' ],
    // () => (s, p, o) => E.Term(DF.quad(s, p, o)),
    // TODO: See if we should be limiting to just quads rather than allowing BaseQuads
    // TODO: Avoid the unecessary RDF conversion here
    context => (subject, predicate, object) => new E.Triple(
      DF.quad(subject.toRDF(), predicate.toRDF(), object.toRDF()),
      context.superTypeProvider,
      context.enableExtendedXsdTypes,
      context.sparqlStar,
    ),
  )
    // .onNumeric1(() => term => bool(true))
    // .onTerm1(() => term => bool(term.termType === 'triple'))
    .collect(),
};

/**
 * https://w3c.github.io/rdf-star/cg-spec/editors_draft.html#subject
 */
const subject = {
  arity: 1,
  overloads: declare(C.SparqlStarOperator.SUBJECT)
  // TODO: See if any other 'on's are required
  // .onTriple1(() => term => {

    //   console.log('on triple called with', term);
    //   throw new Error('boo')
    // })
    .onTerm1(args => term => {
      const elem = term.toRDF();
      if (elem.termType !== 'Quad') {
        throw new Error(`Operator "subject" expects a Triple as input, received ${elem.termType}`);
      }
      const transformer = new TermTransformer(args.superTypeProvider, args.enableExtendedXsdTypes, args.sparqlStar);
      return transformer.transformRDFTermUnsafe(elem.subject);
    })
    //   If (term.termType === 'triple') {
    //     return term.s
    //   }

  //   // console.log('on term')
  //   // const elem = term.toRDF();
  //   // console.log('the elem is', elem)
  //   // if (elem.termType === 'Quad') {

    //   //   return elem.subject as any
    //   // }
    //   // if (term.termType === 'triple') {
    //     // return term.toRDF().
    //   // }
    // })
    .collect(),
};

/**
 * https://w3c.github.io/rdf-star/cg-spec/editors_draft.html#predicate
 */
const predicate = {
  arity: 1,
  overloads: declare(C.SparqlStarOperator.PREDICATE)
    // TODO: See if any other 'on's are required
    // .onTriple1(() => term => term.predicate)
    .onTerm1(args => term => {
      const elem = term.toRDF();
      if (elem.termType !== 'Quad') {
        throw new Error(`Operator "predicate" expects a Triple as input, received ${elem.termType}`);
      }
      const transformer = new TermTransformer(args.superTypeProvider, args.enableExtendedXsdTypes, args.sparqlStar);
      return transformer.transformRDFTermUnsafe(elem.predicate);
    })
    .collect(),
};

/**
 * https://w3c.github.io/rdf-star/cg-spec/editors_draft.html#object
 */
const object = {
  arity: 1,
  overloads: declare(C.SparqlStarOperator.OBJECT)
    // TODO: See if any other 'on's are required
    // .onTriple1(() => term => term.object)
    .onTerm1(args => term => {
      const elem = term.toRDF();
      if (elem.termType !== 'Quad') {
        throw new Error(`Operator "object" expects a Triple as input, received ${elem.termType}`);
      }
      const transformer = new TermTransformer(args.superTypeProvider, args.enableExtendedXsdTypes, args.sparqlStar);
      return transformer.transformRDFTermUnsafe(elem.object);
    })
    .collect(),
};

/**
 * https://w3c.github.io/rdf-star/cg-spec/editors_draft.html#istriple
 */
const isTriple = {
  arity: 1,
  overloads: declare(C.SparqlStarOperator.IS_TRIPLE)
    // TODO: See if any other 'on's are required
    .onTerm1(() => term => bool(term.termType === 'triple'))
    .collect(),
};

/**
 * Collect all the definitions from above into an object
 */
export const sparqlStarDefinitions: Record<C.SparqlStarOperator, IOverloadedDefinition> = {
  // // --------------------------------------------------------------------------
  // // Operator Mapping
  // // https://www.w3.org/TR/sparql11-query/#OperatorMapping
  // // --------------------------------------------------------------------------
  // TODO: Find the equivalent link to above and replace
  // TODO: Add relevant sparqlStar links here
  istriple: isTriple,
  triple,
  subject,
  predicate,
  object,
};

