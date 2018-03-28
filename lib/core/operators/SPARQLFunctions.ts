import * as RDFDM from 'rdf-data-model';

import { UnimplementedError } from '../../util/Errors';
import { ITermExpression } from '../Expressions';

export function RDFTermEqual(left: ITermExpression, right: ITermExpression) {
  return left.toRDF().equals(right.toRDF());
}
