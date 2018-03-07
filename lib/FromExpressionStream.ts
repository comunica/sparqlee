import { Algebra as Alg } from 'sparqlalgebrajs';
import { AsyncIterator } from 'asynciterator';
import * as RDF from 'rdf-js';

import { BindingsStream, Bindings } from './core/Bindings';

export type Lookup = (pattern: Alg.Bgp) => Promise<boolean>;

export interface IFilteredStream extends BindingsStream { };

export interface IEvaluatedBindings {
  bindings: Bindings,
  result: RDF.Term,
}

export interface IEvaluatedStream extends AsyncIterator<IEvaluatedBindings> { };