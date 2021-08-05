import { stringToTerm, termToString } from 'rdf-string';
import { ExpressionError } from '../../lib/util/Errors';
import { stringToTermPrefix } from './Aliases';
import type { GeneralEvaluationConfig } from './generalEvaluation';
import { generalEvaluate } from './generalEvaluation';
import type { AliasMap } from './TruthTable';
import { Notation } from './TruthTable';

export interface ITestArgumentBase {
  operation: string;
  arity: 1 | 2;
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

export function test(arg: TestArgument): void {
  if (!(arg.testTable || arg.errorTable)) {
    // We throw this error and don't just say all is well because not providing a table is probably a user mistake.
    throw new Error('Can not test if neither testTable or errorTable is provided');
  }
  const testTable = (arg.arity === 2) ?
    new BinaryTable(arg) :
    new UnaryTable(arg);

  testTable.test();
}

type Row = [string, string, string] | [string, string];

abstract class Table<RowType extends Row> {
  protected abstract readonly parser: TableParser<RowType>;
  protected abstract readonly def: TestArgument;

  abstract test(): void;

  protected async testExpression(expr: string, result: string) {
    const { config, additionalPrefixes } = this.def;
    const aliases = this.def.aliases || {};
    result = aliases[result] || result;
    const evaluated = await generalEvaluate({
      expression: template(expr, additionalPrefixes), expectEquality: true, generalEvaluationConfig: config,
    });
    expect(evaluated.asyncResult).toEqual(stringToTermPrefix(result, additionalPrefixes));
  }

  protected async testErrorExpression(expr: string, error: string) {
    const { config, additionalPrefixes } = this.def;
    await expect(generalEvaluate({
      expression: template(expr, additionalPrefixes), expectEquality: true, generalEvaluationConfig: config,
    })).rejects.toThrow(error);
  }

  protected abstract format(args: string[]): string;
}

class UnaryTable extends Table<[string, string]> {
  protected readonly parser: TableParser<[string, string]>;
  protected readonly def: TestArgument;
  public constructor(def: TestArgument) {
    super();
    this.def = def;
    this.parser = new UnaryTableParser(def.testTable, def.errorTable);
  }

  public test(): void {
    this.parser.table.forEach(row => {
      const [ arg, result ] = row;
      const { operation } = this.def;
      const aliases = this.def.aliases || {};
      it(`${this.format([ operation, arg ])} should return ${result}`, async() => {
        const rdfArg = aliases[arg] || arg;
        const expr = this.format([ operation, rdfArg ]);
        await this.testExpression(expr, result);
      });
    });

    this.parser.errorTable.forEach(row => {
      const [ arg, error ] = row;
      const { aliases, operation } = this.def;
      it(`${this.format([ operation, arg ])} should error`, async() => {
        const rdfArg = aliases[arg] || arg;
        const expr = this.format([ operation, rdfArg ]);
        await this.testErrorExpression(expr, error);
      });
    });
  }

  protected format([ op, arg ]: string[]): string {
    switch (this.def.notation) {
      case Notation.Function: return `${op}(${arg})`;
      case Notation.Prefix: return `${op}${arg}`;
      case Notation.Infix: throw new Error('Cant format a unary operator as infix.');
      default: throw new Error('Unreachable');
    }
  }
}

// TODO: Let tables only test function evaluation from the definitions, not the whole evaluator.
class BinaryTable extends Table<[string, string, string]> {
  protected readonly parser: TableParser<[string, string, string]>;
  protected readonly def: TestArgument;
  public constructor(def: TestArgument) {
    super();
    this.def = def;
    this.parser = new BinaryTableParser(def.testTable, def.errorTable);
  }

  public test(): void {
    this.parser.table.forEach(row => {
      const [ left, right, result ] = row;
      const { operation } = this.def;
      const aliases = this.def.aliases || {};
      it(`${this.format([ operation, left, right ])} should return ${result}`, async() => {
        const rdfLeft = aliases[left] || left;
        const rdfRight = aliases[right] || right;
        const expr = this.format([ operation, rdfLeft, rdfRight ]);
        await this.testExpression(expr, result);
      });
    });

    this.parser.errorTable.forEach(row => {
      const [ left, right, error ] = row;
      const { aliases, operation } = this.def;
      it(`${this.format([ operation, left, right ])} should error`, async() => {
        const rdfLeft = aliases[left] || left;
        const rdfRight = aliases[right] || right;
        const expr = this.format([ operation, rdfLeft, rdfRight ]);
        await this.testErrorExpression(expr, error);
      });
    });
  }

  protected format([ op, fst, snd ]: string[]): string {
    switch (this.def.notation) {
      case Notation.Function: return `${op}(${fst}, ${snd})`;
      case Notation.Prefix: return `${op} ${fst} ${snd}`;
      case Notation.Infix: return `${fst} ${op} ${snd}`;
      default: throw new Error('Unreachable');
    }
  }
}

abstract class TableParser<RowType extends Row> {
  public readonly table: RowType[];
  public readonly errorTable: RowType[];

  public constructor(table?: string, errTable?: string) {
    this.table = table ? this.splitTable(table).map(row => this.parseRow(row)) : [];
    this.errorTable = (errTable) ?
      this.splitTable(errTable).map(r => this.parseRow(r)) :
      [];
  }

  protected abstract parseRow(row: string): RowType;

  private splitTable(table: string): string[] {
    // Trim whitespace, and remove blank lines
    table = table.trim().replace(/^\s*[\n\r]/ugm, '');
    return table.split('\n');
  }
}

class BinaryTableParser extends TableParser<[string, string, string]> {
  protected parseRow(row: string): [string, string, string] {
    row = row.trim().replace(/  +/ug, ' ');
    const [ left, right, _, result ] = row.match(/([^\s']+|'[^']*')+/ug)
      .map(i => i.replace(/'([^']*)'/u, '$1'));
    return [ left, right, result ];
  }
}

class UnaryTableParser extends TableParser<[string, string]> {
  protected parseRow(row: string): [string, string] {
    // Trim whitespace and remove double spaces
    row = row.trim().replace(/  +/ug, ' ');
    const [ arg, _, result ] = row.match(/([^\s']+|'[^']*')+/ug)
      .map(i => i.replace(/'([^']*)'/u, '$1'));
    return [ arg, result ];
  }
}

// =====================================================================================================================
// =====================================================================================================================
// =====================================================================================================================

export function testAll(exprs: string[], config?: GeneralEvaluationConfig) {
  exprs.forEach(_expr => {
    const expr = _expr.trim();
    const matched = expr.match(/ = [^=]*$/ug);
    if (!matched) {
      throw new Error(`Could not match '${expr}'`);
    }
    const equals = matched.pop();
    const body = expr.replace(equals, '');
    const _result = equals.replace(' = ', '');
    const result = stringToTerm(replacePrefix(_result));
    // Console.log(`${expr}\n${equals}\n${body}\n${_result}\n${result}`);
    it(`${body} should evaluate to ${_result}`, async() => {
      const evaluated = await generalEvaluate({
        expression: template(body), expectEquality: true, generalEvaluationConfig: config,
      });
      expect(termToString(evaluated.asyncResult)).toEqual(termToString(result));
    });
  });
}

export function testAllErrors(exprs: string[], config?: GeneralEvaluationConfig) {
  exprs.forEach(_expr => {
    const expr = _expr.trim();
    const equals = (/ = error *$/u.exec(expr))[0];
    const body = expr.replace(equals, '');
    it(`${body} should error`, () => {
      return expect(generalEvaluate({
        expression: template(body), expectEquality: true, generalEvaluationConfig: config,
      }).then(res => termToString(res.asyncResult)))
        .rejects
        .toThrowError(ExpressionError);
    });
  });
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

export const aliases = {
  true: '"true"^^xsd:boolean',
  false: '"false"^^xsd:boolean',
};

export function int(value: string): string {
  return compactTermString(value, 'xsd:integer');
}

export function decimal(value: string): string {
  return compactTermString(value, 'xsd:decimal');
}

export function double(value: string): string {
  return compactTermString(value, 'xsd:double');
}

export function date(value: string): string {
  return compactTermString(value, 'xsd:dateTime');
}

function compactTermString(value: string, dataType: string): string {
  return `"${value}"^^${dataType}`;
}

export const prefixes: Record<string, string> = {
  xsd: 'http://www.w3.org/2001/XMLSchema#',
  rdf: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#',
};

export function replacePrefix(str: string): string {
  const prefixLocs = /\^\^.*:/u.exec(str);
  if (!prefixLocs) { return str; }
  const prefix = prefixLocs[0].slice(2, -1);
  return str.replace(`${prefix}:`, prefixes[prefix]);
}
