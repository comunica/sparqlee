import { bool, numeric } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import type { ITestTableConfigBase } from '../../util/utils';
import { runTestTable } from '../../util/utils';

describe('unary functions', () => {
  describe('evaluation of \'! (unary)\' like', () => {
    const config: ITestTableConfigBase = {
      arity: 1,
      operation: '!',
      notation: Notation.Prefix,
      aliases: bool,
    };
    runTestTable({
      ...config,
      testTable: `
        true = false
        false = true
      `,
    });
    describe('should cast to EVB so', () => {
      runTestTable({
        ...config,
        testTable: `
          "" = true
          "3"^^xsd:integer = false                  
        `,
      });
    });
  });

  describe('evaluation of \'+ (unary)\' like', () => {
    // TODO: This test does not use the unary plus operator from regular functions.
    //  When it does, the test '"-6"^^<${TypeURL.XSD_NEGATIVE_INTEGER}>' = -6i should be added.
    runTestTable({
      arity: 1,
      aliases: numeric,
      operation: '+',
      notation: Notation.Prefix,
      testTable: `
        "3"^^xsd:integer     = "3"^^xsd:integer
        "-10.5"^^xsd:decimal = "-10.5"^^xsd:decimal
        "NaN"^^xsd:float     = "NaN"^^xsd:float
        0i = 0i
        -6i = -6i
        6i = 6i
      `,
    });
  });

  describe('evaluation of \'- (unary)\' like', () => {
    // '- "0"^^xsd:float       = "-0."^^xsd:float   ' // TODO: Document
    runTestTable({
      arity: 1,
      operation: '-',
      notation: Notation.Prefix,
      testTable: `
        "3"^^xsd:integer     = "-3"^^xsd:integer
        "0"^^xsd:integer     = "0"^^xsd:integer
        "-10.5"^^xsd:decimal = "10.5"^^xsd:decimal
        "NaN"^^xsd:float     = "NaN"^^xsd:float
        "-0"^^xsd:float      = "0"^^xsd:float
        "-INF"^^xsd:float    = "INF"^^xsd:float
        "INF"^^xsd:float     = "-INF"^^xsd:float
      `,
    });
  });
});
