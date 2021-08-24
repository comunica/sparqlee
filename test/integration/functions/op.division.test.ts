import { TypeURL } from '../../../lib/util/Consts';
import { decimal, merge, numeric } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

const config = {
  arity: 2,
  op: '/',
  aliases: merge(numeric),
  notation: Notation.Infix,
};

describe('evaluation of \'/\' like', () => {
  runTestTable({
    arity: 2,
    operation: '/',
    aliases: numeric,
    notation: Notation.Infix,
    config: {
      type: 'sync',
      config: {
        getSuperType: unknownType => TypeURL.XSD_INTEGER,
      },
    },
    testTable: `
      0i   1i  = 0d
      2i   1i  = 2d
      12i  6i  = 2d
      6i   INF = 0f
      6i  -INF = 0f
    
      -0f  -0f =  NaN
       1f  -1f = -1f
       12f  6f =  2f
      -3f   0f = -INF
       3f   0f =  INF
    
      INF -INF = NaN
      INF  0f  = INF
      0f  -INF = 0f
    
      NaN    NaN    = NaN
      NaN    anyNum = NaN
      anyNum NaN    = NaN
      
      "2"^^example:int "2"^^example:int = ${decimal('1')}
    `,
    errorTable: `
      0i 0i = 'Integer division by 0'
      3i 0i = 'Integer division by 0'
      "2"^^example:int "0"^^example:int = 'Integer division by 0'
          `,
  });
});
