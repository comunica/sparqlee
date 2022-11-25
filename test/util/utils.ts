import * as LRUCache from 'lru-cache';
import type { translate } from 'sparqlalgebrajs';
import type { ICompleteSharedContext } from '../../lib/evaluators/evaluatorHelpers/BaseExpressionEvaluator';
import type { AliasMap } from './Aliases';
import type { GeneralEvaluationConfig } from './generalEvaluation';
import type { Notation } from './TestTable';
import { BinaryTable, UnaryTable, VariableTable } from './TestTable';

export interface ITestTableConfigBase {
  /**
   * Operation / function that needs to be called on the arguments provided in the TestTable.
   */
  operation: string;
  /**
   * How many arguments does the operation take. The vary option means you don't know. This can only be provided
   * when the notation is Notation.Function.
   */
  arity: 1 | 2 | 'vary';
  notation: Notation;
  /**
   * Configuration that'll we provided to the Evaluator.
   * If the type is sync, the test will be preformed both sync and async.
   */
  config?: GeneralEvaluationConfig;
  aliases?: AliasMap;
  /**
   * Additional prefixes can be provided if the defaultPrefixes in ./Aliases.ts are not enough.
   */
  additionalPrefixes?: Record<string, string>;
}
export type TestTableConfig = ITestTableConfigBase & {
  /**
   * TestTable that will check equality;
   */
  testTable?: string | string[][];
  /**
   * TestTable that will check if a given error is thrown.
   * Result can be '' if the message doesn't need to be checked.
   */
  errorTable?: string | string[][];
  /**
   * Options to pass to sparqlalgebrajs
   */
  parserOptions?: Parameters<typeof translate>[1];
};

export function runTestTable(arg: TestTableConfig): void {
  if (!(arg.testTable || arg.errorTable)) {
    // We throw this error and don't just say all is well because not providing a table is probably a user mistake.
    throw new Error('Can not test if neither testTable or errorTable is provided');
  }
  let testTable: UnaryTable | BinaryTable | VariableTable;
  if (arg.arity === 1) {
    testTable = new UnaryTable(arg);
  } else if (arg.arity === 2) {
    testTable = new BinaryTable(arg);
  } else {
    testTable = new VariableTable(arg);
  }

  testTable.test();
}

export function getDefaultSharedContext(): ICompleteSharedContext {
  return {
    now: new Date(),
    superTypeProvider: {
      cache: new LRUCache(),
      discoverer: () => 'term',
    },
    overloadCache: new LRUCache(),
    enableExtendedXsdTypes: false,
    // TODO: Double check that this should be the default
    sparqlStar: false,
  };
}

