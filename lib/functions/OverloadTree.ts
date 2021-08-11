import type * as E from '../expressions';
import type { LiteralTypes } from '../util/Consts';
import { TypeAlias, TypeURL } from '../util/Consts';
import type { ArgumentType } from './Core';

export type SearchStack = OverloadTree[];
export type OverRideType = LiteralTypes | 'term';

/**
 * Some of the types here have some super relation.
 * This should match the relations provided in @see{transformLiteral}.
 * Types that are not mentioned just map to 'term'.
 * A DAG will be created based on this. Make sure it doesn't have any cycles!
 */
export const extensionTableInput: Record<LiteralTypes, OverRideType> = {
  [TypeURL.XSD_DATE_TIME]: 'term',
  [TypeURL.XSD_BOOLEAN]: 'term',
  [TypeURL.XSD_DATE]: 'term',
  [TypeURL.XSD_DURATION]: 'term',
  [TypeAlias.SPARQL_NUMERIC]: 'term',
  [TypeAlias.SPARQL_STRINGLY]: 'term',
  [TypeAlias.SPARQL_OTHER]: 'term',
  [TypeAlias.SPARQL_NON_LEXICAL]: 'term',

  // Datetime types
  [TypeURL.XSD_DATE_TIME_STAMP]: TypeURL.XSD_DATE_TIME,

  // Duration types
  [TypeURL.XSD_DAYTIME_DURATION]: TypeURL.XSD_DURATION,
  [TypeURL.XSD_YEAR_MONTH_DURATION]: TypeURL.XSD_DURATION,

  // Stringly types
  [TypeURL.RDF_LANG_STRING]: TypeAlias.SPARQL_STRINGLY,
  [TypeURL.XSD_STRING]: TypeAlias.SPARQL_STRINGLY,

  // XSD_ANY_URI is a weird one, it was handled equal to XSD_STRING before, we keep this? TODO - need to edit chart
  [TypeURL.XSD_ANY_URI]: TypeURL.XSD_STRING,

  // String types
  [TypeURL.XSD_NORMALIZED_STRING]: TypeURL.XSD_STRING,
  [TypeURL.XSD_TOKEN]: TypeURL.XSD_NORMALIZED_STRING,
  [TypeURL.XSD_LANGUAGE]: TypeURL.XSD_TOKEN,
  [TypeURL.XSD_NM_TOKEN]: TypeURL.XSD_TOKEN,
  [TypeURL.XSD_NAME]: TypeURL.XSD_TOKEN,
  [TypeURL.XSD_NC_NAME]: TypeURL.XSD_NAME,
  [TypeURL.XSD_ENTITY]: TypeURL.XSD_NC_NAME,
  [TypeURL.XSD_ID]: TypeURL.XSD_NC_NAME,
  [TypeURL.XSD_ID_REF]: TypeURL.XSD_NC_NAME,

  // Numeric types
  // https://www.w3.org/TR/sparql11-query/#operandDataTypes
  // > numeric denotes typed literals with datatypes xsd:integer, xsd:decimal, xsd:float, and xsd:double
  [TypeURL.XSD_DECIMAL]: TypeAlias.SPARQL_NUMERIC,
  [TypeURL.XSD_FLOAT]: TypeAlias.SPARQL_NUMERIC,
  [TypeURL.XSD_DOUBLE]: TypeAlias.SPARQL_NUMERIC,

  // Decimal types
  [TypeURL.XSD_INTEGER]: TypeURL.XSD_DECIMAL,

  [TypeURL.XSD_NON_POSITIVE_INTEGER]: TypeURL.XSD_INTEGER,
  [TypeURL.XSD_NEGATIVE_INTEGER]: TypeURL.XSD_NON_POSITIVE_INTEGER,

  [TypeURL.XSD_LONG]: TypeURL.XSD_INTEGER,
  [TypeURL.XSD_INT]: TypeURL.XSD_LONG,
  [TypeURL.XSD_SHORT]: TypeURL.XSD_INT,
  [TypeURL.XSD_BYTE]: TypeURL.XSD_SHORT,

  [TypeURL.XSD_NON_NEGATIVE_INTEGER]: TypeURL.XSD_INTEGER,
  [TypeURL.XSD_POSITIVE_INTEGER]: TypeURL.XSD_NON_NEGATIVE_INTEGER,
  [TypeURL.XSD_UNSIGNED_LONG]: TypeURL.XSD_NON_NEGATIVE_INTEGER,
  [TypeURL.XSD_UNSIGNED_INT]: TypeURL.XSD_UNSIGNED_LONG,
  [TypeURL.XSD_UNSIGNED_SHORT]: TypeURL.XSD_UNSIGNED_INT,
  [TypeURL.XSD_UNSIGNED_BYTE]: TypeURL.XSD_UNSIGNED_SHORT,
};

type SubExtensionTable = Record<LiteralTypes, number>;
type SubExtensionTableBuilder = SubExtensionTable & { depth: number };
type ExtensionTable = Record<LiteralTypes, SubExtensionTable>;
type ExtensionTableBuilder = Record<LiteralTypes, SubExtensionTableBuilder>;
export let extensionTable: ExtensionTable;
// No circular structure allowed! & No other keys allowed!
function extensionTableInit(): void {
  const res: ExtensionTableBuilder = Object.create(null);
  for (const [ _key, value ] of Object.entries(extensionTableInput)) {
    const key = <LiteralTypes> _key;
    if (res[key]) {
      continue;
    }
    extensionTableBuilderInitKey(key, value, res);
  }
  for (const subTable of Object.values(res)) {
    delete subTable.depth;
  }
  extensionTable = res;
}
function extensionTableBuilderInitKey(key: LiteralTypes, value: OverRideType, res: ExtensionTableBuilder): void {
  if (value === 'term' || value === undefined) {
    const baseRes = Object.create(null);
    baseRes.depth = 0;
    baseRes[key] = key;
    res[key] = baseRes;
    return;
  }
  if (!res[value]) {
    extensionTableBuilderInitKey(value, extensionTableInput[value], res);
  }
  res[key] = { ...res[value], [key]: res[value].depth + 1, depth: res[value].depth + 1 };
}
extensionTableInit();

export function typeCanBeProvidedTo(_baseType: string, argumentType: LiteralTypes): boolean {
  if (![ ...Object.values(TypeAlias), ...Object.values(TypeURL), 'term' ].includes(_baseType)) {
    return false;
  }
  const baseType = <OverRideType> _baseType;
  return baseType === 'term' ||
    (extensionTable[baseType] && extensionTable[baseType][argumentType] !== undefined);
}

/**
 * Maps argument types on their specific implementation in a tree like structure.
 */
export class OverloadTree {
  private implementation?: E.SimpleApplication | undefined;
  private readonly subTrees: Record<ArgumentType, OverloadTree>;

  public constructor() {
    this.implementation = undefined;
    this.subTrees = Object.create(null);
  }

  /**
   * Get the implementation that exactly matches @param args .
   */
  public getImplementationExact(args: ArgumentType[]): E.SimpleApplication | undefined {
    // eslint-disable-next-line @typescript-eslint/no-this-alias,consistent-this
    let node: OverloadTree = this;
    for (const expression of args) {
      node = node.subTrees[expression];
      if (!node) {
        return undefined;
      }
    }
    return node.implementation;
  }

  /**
   * Searches in a depth first way for the best matching overload. considering this a the tree's root.
   * @param args
   */
  public search(args: E.TermExpression[]): E.SimpleApplication | undefined {
    // SearchStack is a stack of all node's that need to be checked for implementation.
    // It provides an easy way to keep order in our search.
    const searchStack: { node: OverloadTree; index: number }[] = [];
    const startIndex = 0;
    if (args.length === 0) {
      return this.implementation;
    }
    // GetSubTreeWithArg return a SearchStack containing the node's that should be contacted next.
    // We also log the index since there is no other way to remember this index.
    // the provided stack should be pushed on top of our search stack since it also has it's order.
    searchStack.push(...this.getSubTreeWithArg(args[startIndex]).map(node =>
      ({ node, index: startIndex + 1 })));
    while (searchStack.length > 0) {
      const { index, node } = <{ node: OverloadTree; index: number }>searchStack.pop();
      // We check the implementation because it would be possible a path is created but not implemented.
      // ex: f(double, double, double) and f(term, term). and calling f(double, double).
      if (index === args.length && node.implementation) {
        return node.implementation;
      }
      searchStack.push(...node.getSubTreeWithArg(args[index]).map(item =>
        ({ node: item, index: index + 1 })));
    }
    return undefined;
  }

  /**
   * Adds an overload to the tree structure considering this as the tree's root.
   * @param argumentTypes a list of ArgumentTypes that would need to be provided in the same order to
   * get the implementation.
   * @param func the implementation for this overload.
   */
  public addOverload(argumentTypes: ArgumentType[], func: E.SimpleApplication): void {
    this._addOverload([ ...argumentTypes ], func);
  }

  private _addOverload(argumentTypes: ArgumentType[], func: E.SimpleApplication): void {
    const argumentType = argumentTypes.shift();
    if (!argumentType) {
      this.implementation = func;
      return;
    }
    if (!this.subTrees[argumentType]) {
      this.subTrees[argumentType] = new OverloadTree();
    }
    this.subTrees[argumentType]._addOverload(argumentTypes, func);
  }

  /**
   * @param arg term to try and match to possible overloads of this node.
   * @returns SearchStack a stack with top element the next node that should be asked for implementation or overload.
   */
  private getSubTreeWithArg(arg: E.TermExpression): SearchStack {
    const res: SearchStack = [];
    // These types refer to Type exported by lib/util/Consts.ts
    if (this.subTrees.term) {
      res.push(this.subTrees.term);
    }
    // TermTypes are defined in E.TermType.
    if (this.subTrees[arg.termType]) {
      res.push(this.subTrees[arg.termType]);
    }
    if (arg.termType === 'literal') {
      const concreteType = (<E.Literal<any>> arg).type;
      const possibleMatches = <[OverRideType, number][]> Object.entries(extensionTable[concreteType]);
      const matches = possibleMatches.filter(([ matchType, _ ]) => matchType in this.subTrees);
      matches.sort(([ matchTypeA, prioA ], [ matchTypeB, prioB ]) => prioA - prioB);
      res.push(...matches.map(([ sortedType, _ ]) => this.subTrees[sortedType]));
    }
    return res;
  }
}

/**
 * Provided a list of Types this will return the most concrete type implemented by all items in that list.
 * @param args
 */
export function typeWidening(...args: LiteralTypes[]): OverRideType {
  if (args.length === 0) {
    throw new Error('Should get at least 1 arg');
  }
  if (args.length === 1) {
    return args[0];
  }
  // We could keep these sorted lists in memory but we don't need them that often?
  const sorted = args.map(overrideType => Object.entries(extensionTable[overrideType])
    .sort(([ typeA, prioA ], [ typeB, prioB ]) => prioA - prioB)
    .map(([ urlType, prio ]) => <OverRideType>urlType));
  let res: OverRideType = 'term';
  let index = 0;
  const max = Math.max(...sorted.map(list => list.length));
  while (index < max) {
    const tempRes: OverRideType = sorted[0][index];
    // eslint-disable-next-line @typescript-eslint/no-loop-func
    if (sorted.some(list => list[index] !== tempRes)) {
      return res;
    }
    res = tempRes;
    ++index;
  }
  return res;
}

/**
 * Some weird casting rules. I took them over from the previous implementation, that implementation said:
 * > Arithmetic operators take 2 numeric arguments, and return a single numerical
 * > value. The type of the return value is heavily dependant on the types of the
 * > input arguments. In JS everything is a double, but in SPARQL it is not.
 * > {@link https://www.w3.org/TR/sparql11-query/#OperatorMapping}
 * > {@link https://www.w3.org/TR/xpath-functions/#op.numeric}
 * @param args
 */
export function arithmeticWidening(...args: LiteralTypes[]): LiteralTypes {
  const _widened = typeWidening(...args);
  if (![ ...Object.values(TypeAlias), ...Object.values(TypeURL) ].includes(<LiteralTypes>_widened)) {
    throw new Error('should never happen');
  }
  const widened = <LiteralTypes>_widened;
  if (widened !== TypeAlias.SPARQL_NUMERIC) {
    return widened;
  }
  let res: LiteralTypes = TypeURL.XSD_DECIMAL;
  for (const concreteType of args) {
    if (concreteType === TypeAlias.SPARQL_NUMERIC) {
      res = concreteType;
    } else if (concreteType === TypeURL.XSD_DOUBLE && res !== TypeAlias.SPARQL_NUMERIC) {
      res = concreteType;
    } else if (concreteType === TypeURL.XSD_FLOAT && res === TypeURL.XSD_DECIMAL) {
      res = concreteType;
    }
  }
  return res;
}
