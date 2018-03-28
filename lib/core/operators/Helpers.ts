import { Map, Record, List } from 'immutable';
import * as RDFDM from 'rdf-data-model';

import * as C from '../../util/Consts';
import { UnimplementedError } from '../../util/Errors';
import * as E from '../Expressions';

// ----------------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------------

export function nl(val: number, type?: C.DataType) {
  return new E.NumericLiteral(
    val,
    undefined,
    RDFDM.namedNode(type || C.DataType.XSD_FLOAT),
  );
}

export function bl(val: boolean) {
  return new E.BooleanLiteral(
    val,
    undefined,
    RDFDM.namedNode(C.DataType.XSD_BOOLEAN),
  );
}

// ----------------------------------------------------------------------------
// Type Safety Helpers
// ----------------------------------------------------------------------------

// Immutable.js type definitions are pretty unsafe, and this is typo-prone work
// https://medium.com/@alexxgent/enforcing-types-with-immutablejs-and-typescript-6ab980819b6a

// tslint:disable-next-line:interface-over-type-literal
export type ImplType = {
  types: E.ArgumentType[];
  func: (args: E.ITermExpression[]) => E.ITermExpression;
};

function implDefaults() {
  return {
    types: <E.ArgumentType[]>[],
    func(args: E.ITermExpression[]) {
      throw new UnimplementedError();
    },
  };
}

export class Impl extends Record(implDefaults()) {
  constructor(params: ImplType) { super(params); }
  public get<T extends keyof ImplType>(value: T): ImplType[T] {
    return super.get(value);
  }
}

export function map(implementations: Impl[]): E.OverloadMap {
  return Map(implementations.map((i) => [List(i.get('types')), i.get('func')]));
}
