#! /usr/bin/env node

import { Algebra as Alg } from 'sparqlalgebrajs';
import { isEqual } from 'lodash';

import { ArrayIterator, AsyncIterator } from 'asynciterator';
import { AsyncFilter } from '../index';
import { example1, parse } from './util/Examples';
import { Bindings } from '../lib/FilteredStream';

const mockLookup = (pattern: Alg.Bgp) => {
  return new Promise<boolean>((resolve, reject) => {
    return resolve(true);
  });
};

function print(expr: string): void {
  console.log(JSON.stringify(parse(expr), null, 4));
}

function main(): void {
  const ex = example1;
  const input = [ex.mapping()]
  const istream = new ArrayIterator(input);
  const filter = new AsyncFilter(ex.expression, istream, mockLookup);
  filter.on('error', (error) => console.log(error) );
  filter.on('end', () => {
    input.forEach(binding => {
      let vals = binding.map((v, k) => v.value);
      if (results.find((v) => isEqual(binding, v))) {
        console.log("True:", vals);
      } else {
        console.log("False:", vals);
      }
    });
  })
  let results = new Array<Bindings>(); filter.each(r => results.push(r));
}

// test();
// print('EXISTS {?a ?b ?c}');
// print('?a + str(<http://example.com>)')
print('"aaaaaaa"')
// print('COUNT(?a)')
// main();
