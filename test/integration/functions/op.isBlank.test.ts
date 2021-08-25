import { bool } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import { runTestTable } from '../../util/utils';

describe('evaluation of \'isBlank\' like', () => {
  runTestTable({
    arity: 1,
    aliases: bool,
    operation: 'isBlank',
    notation: Notation.Function,
    testTable: `
        BNODE() = true
        '"some string"' = false
        '<http://dbpedia.org/resource/Adventist_Heritage>' = false
      `,
  });
});
