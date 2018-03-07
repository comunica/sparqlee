#! /usr/bin/env node

import { Algebra as Alg } from 'sparqlalgebrajs';
import * as _ from 'lodash';
import * as RDF from 'rdf-data-model';

import { ArrayIterator, AsyncIterator } from 'asynciterator';
import { AsyncEvaluatedStream } from '../index';
import { example1, parse, Example } from './util/Examples';
import { Bindings } from '../lib/core/Bindings';
import { DataType as DT } from '../lib/util/Consts';
import { AsyncEvaluator } from '../lib/async/AsyncEvaluator';

const mockLookup = (pattern: Alg.Bgp) => {
  return new Promise<boolean>((resolve, reject) => {
    return resolve(true);
  });
};

function print(expr: string): void {
  console.log(JSON.stringify(parse(expr), null, 4));
}

async function testEval() {
  const ex = new Example('?a + ?b', () => Bindings({
    a: RDF.literal("3", RDF.namedNode(DT.XSD_INTEGER)),
    b: RDF.literal("3", RDF.namedNode(DT.XSD_NON_NEGATIVE_INTEGER))
  }));
  const evaluator = new AsyncEvaluator(ex.expression, mockLookup);
  const presult = evaluator.evaluate(ex.mapping());
  const val = await presult;
  console.log(val);
}

function main(): void {
  // const ex = example1;
  const ex = new Example('-?a', () => Bindings({
    a: RDF.literal("3", RDF.namedNode(DT.XSD_INTEGER))
  }));
  const input = [ex.mapping()]
  const istream = new ArrayIterator(input);
  const evalled = new AsyncEvaluatedStream(ex.expression, istream, mockLookup);
  evalled.on('error', (error) => console.log(error));
  evalled.on('data', (data) => {
    console.log(JSON.stringify(data, undefined, 4))
  });
  // filter.on('end', () => {
  //   input.forEach(binding => {
  //     let vals = binding.map((v, k) => v.value);
  //     if (results.find((v) => _.isEqual(binding, v))) {
  //       console.log("True:", vals);
  //     } else {
  //       console.log("False:", vals);
  //     }
  //   });
  // })
  // let results = new Array<Bindings>(); filter.each(r => results.push(r));
}

testEval();
// test();
// print('EXISTS {?a ?b ?c}');
// print('?a + str(<http://example.com>)')
// print('"aaaaaaa"')
// print('bound(?a)');
// print('isLiteral(?a)');
// print('COUNT(?a)')
// print('xsd:dateTime(?a)');
// print('+?a');
// print('(?a > ?b) = ?c')
// main();
