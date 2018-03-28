import * as RDFDM from 'rdf-data-model';

import { RDFEqualTypeError, UnimplementedError } from '../../util/Errors';
import { ITermExpression } from '../Expressions';

export function RDFTermEqual(_left: ITermExpression, _right: ITermExpression) {
  const left = _left.toRDF();
  const right = _right.toRDF();
  const val = left.equals(right);
  if (!val && (left.termType === 'Literal') && (right.termType === 'Literal')) {
    throw new RDFEqualTypeError([_left, _right]);
  }
  return val;
}

export function sameTerm(left: ITermExpression, right: ITermExpression) {
  return left.toRDF().equals(right.toRDF());
}
