import * as RDFDM from 'rdf-data-model';

import * as C from '../../util/Consts';
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
