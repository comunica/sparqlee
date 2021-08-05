import type { AliasMap } from './Aliases';
import type { GeneralEvaluationConfig } from './generalEvaluation';
import type { Notation } from './TruthTable';
import { UnaryTable, BinaryTable, VariableTable } from './TruthTable';

export interface ITestArgumentBase {
  /**
   * Operation / function that needs to be called on the arguments provided in the truthTable.
   */
  operation: string;
  /**
   * How many arguments does the operation take. The vary option means you don't know. This can only be provided
   * when the notation is Notation.function.
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
export type TestArgument = ITestArgumentBase & {
  /**
   * Truth table that will check equality;
   */
  testTable?: string;
  /**
   * Truth table that will check if a given error is thrown.
   * Result can be '' if the message doesn't need to be checked.
   */
  errorTable?: string;
};

export function runTestTable(arg: TestArgument): void {
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

export function template(expr: string, additionalPrefixes?: Record<string, string>) {
  const prefix = additionalPrefixes ?
    Object.entries(additionalPrefixes).map(([ pref, full ]) =>
      `PREFIX ${pref.endsWith(':') ? pref : (`${pref}:`)} <${full}>\n`) :
    '';
  return `
PREFIX xsd: <http://www.w3.org/2001/XMLSchema#>
PREFIX fn: <https://www.w3.org/TR/xpath-functions#>
PREFIX err: <http://www.w3.org/2005/xqt-errors#>
PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
${prefix}
SELECT * WHERE { ?s ?p ?o FILTER (${expr})}
`;
}
