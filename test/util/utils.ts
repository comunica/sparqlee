import type { AliasMap } from './Aliases';
import type { GeneralEvaluationConfig } from './generalEvaluation';
import type { Notation } from './TruthTable';
import { UnaryTable, BinaryTable, VariableTable } from './TruthTable';

export interface ITestArgumentBase {
  operation: string;
  arity: 1 | 2 | 'vary';
  notation: Notation;
  config?: GeneralEvaluationConfig;
  // Aliases map simple strings like 'true' to their RDF counterparts. The counterparts can use prefixes if
  // those are registered by default or by providing them with additionalPrefixes.
  aliases?: AliasMap;
  additionalPrefixes?: Record<string, string>;
}
export type TestArgument = ITestArgumentBase & {
  testTable?: string;
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
