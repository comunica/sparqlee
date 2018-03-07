import { EVB_ERR_STR, FALSE_STR, TRUE_STR } from '../../../lib/util/Consts';

// Some aliases that can be used in the truth tables
const argMapping = {
  true: TRUE_STR,
  false: FALSE_STR,
  error: EVB_ERR_STR,
};

function testOp(
  op: string,
  table: string,
  errTable: string,
  argMap: {} = argMapping,
) {
  testBinOp(op, table, errTable, argMap, resultMapping);
}

// TODO: Test use of EVB
describe('evaluation of logical connectives', () => {
  describe('like "||" receiving', () => {
    const table = `
    true  true  = true
    true  false = true
    false true  = true
    false false = false
    `;

    const errTable = `
    true  error = true
    error true  = true
    false error = error
    error false = error
    error error = error
    `;
    testOp('||', table, errTable);
  });

  describe('like "&&" receiving', () => {
    const table = `
    true  true  = true
    true  false = false
    false true  = false
    false false = false
    `;
    const errTable = `
    true  error = error
    error true  = error
    false error = false
    error false = false
    error error = error
    `;
    testOp('&&', table, errTable);
  });
});
