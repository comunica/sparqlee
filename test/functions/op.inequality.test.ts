import { bool, dateTime, merge, numeric, str } from '../util/Aliases';
import { Notation } from '../util/TruthTable';
import type { ITestArgumentBase } from '../util/utils';
import { runTestTable } from '../util/utils';

const config: ITestArgumentBase = {
  arity: 2,
  operation: '!=',
  aliases: merge(numeric, str, dateTime, bool),
  notation: Notation.Infix,
};

describe('evaluation of \'!=\'', () => {
  describe('with numeric operands like', () => {
    runTestTable({
      ...config,
      testTable: `
        3i 3i = false
        3d 3d = false
        3f 3f = false
    
        3i -5i = true
        3d -5d = true
        3f -5f = true
    
         3i 3f = false
         3i 3d = false
         3d 3f = false
        -0f 0f = false
    
         INF  INF = false
        -INF -INF = false
         INF  3f  = true
         3f   INF = true
         INF  NaN = true
         NaN  NaN = true
         NaN  3f  = true
         3f   NaN = true
      `,
    });
  });

  describe('with string operands like', () => {
    runTestTable({
      ...config,
      testTable: `
        empty empty = false
        empty aaa   = true
        aaa   aaa   = false
        aaa   bbb   = true
      `,
    });
  });

  describe('with boolean operands like', () => {
    runTestTable({
      ...config,
      testTable: `
        true  true  = false
        true  false = true
        false true  = true
        false false = false
      `,
    });
  });

  describe('with dateTime operands like', () => {
    runTestTable({
      ...config,
      testTable: `
        earlyN earlyZ = false
        earlyN earlyN = false
        earlyZ earlyZ = false
    
        earlyN lateN  = true
        earlyN lateZ  = true
        earlyZ lateZ  = true
        earlyZ lateN  = true
    
        edge1 edge2   = false
      `,
    });
  });
});
