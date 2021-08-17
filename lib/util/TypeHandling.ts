import type { LiteralTypes } from './Consts';
import { TypeAlias, TypeURL } from './Consts';

export type OverrideType = LiteralTypes | 'term';

/**
 * Types that are not mentioned just map to 'term'.
 * When editing this, make sure type promotion and substituion don't start interfering.
 * e.g. when saying something like string -> stringly -> anyUri -> term.
 * This would make substitution on types that promote to each other possible. We and the specs don't want that!
 * A DAG will be created based on this. Make sure it doesn't have any cycles!
 */
export const extensionTableInput: Record<LiteralTypes, OverrideType> = {
  // Datetime types
  [TypeURL.XSD_DATE_TIME_STAMP]: TypeURL.XSD_DATE_TIME,

  // Duration types
  [TypeURL.XSD_DAYTIME_DURATION]: TypeURL.XSD_DURATION,
  [TypeURL.XSD_YEAR_MONTH_DURATION]: TypeURL.XSD_DURATION,

  // Stringly types
  [TypeURL.RDF_LANG_STRING]: TypeAlias.SPARQL_STRINGLY,
  [TypeURL.XSD_STRING]: TypeAlias.SPARQL_STRINGLY,

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
  [TypeURL.XSD_DOUBLE]: TypeAlias.SPARQL_NUMERIC,
  [TypeURL.XSD_FLOAT]: TypeAlias.SPARQL_NUMERIC,
  [TypeURL.XSD_DECIMAL]: TypeAlias.SPARQL_NUMERIC,

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

  [TypeURL.XSD_DATE_TIME]: 'term',
  [TypeURL.XSD_BOOLEAN]: 'term',
  [TypeURL.XSD_DATE]: 'term',
  [TypeURL.XSD_DURATION]: 'term',
  [TypeAlias.SPARQL_NUMERIC]: 'term',
  [TypeAlias.SPARQL_STRINGLY]: 'term',
  [TypeAlias.SPARQL_NON_LEXICAL]: 'term',
  [TypeURL.XSD_ANY_URI]: 'term',
};
type SubExtensionTable = Record<LiteralTypes, number>;
type SubExtensionTableBuilder = SubExtensionTable & { depth: number };
type ExtensionTable = Record<LiteralTypes, SubExtensionTable>;
type ExtensionTableBuilder = Record<LiteralTypes, SubExtensionTableBuilder>;
export let extensionTable: ExtensionTable;

// No circular structure allowed! & No other keys allowed!
export function extensionTableInit(): void {
  const res: ExtensionTableBuilder = Object.create(null);
  for (const [ _key, value ] of Object.entries(extensionTableInput)) {
    const key = <LiteralTypes>_key;
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
extensionTableInit();

function extensionTableBuilderInitKey(key: LiteralTypes, value: OverrideType, res: ExtensionTableBuilder): void {
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

export let typeAliasCheck: Record<TypeAlias, boolean>;
function initTypeAliasCheck(): void {
  typeAliasCheck = Object.create(null);
  for (const val of Object.values(TypeAlias)) {
    typeAliasCheck[val] = true;
  }
}
initTypeAliasCheck();

export function isTypeAlias(type: string): TypeAlias | undefined {
  if (type in typeAliasCheck) {
    return <TypeAlias> type;
  }
  return undefined;
}

export function isLiteralType(type: string): LiteralTypes | undefined {
  if (type in extensionTable) {
    return <LiteralTypes> type;
  }
  return undefined;
}

export function isOverrideType(type: string): OverrideType | undefined {
  if (isLiteralType(type) || type === 'term') {
    return <OverrideType> type;
  }
  return undefined;
}

/**
 * This function needs do be O(1) at all times! The execution time of this function is vital!
 * We define typeA isSubtypeOf typeA as true.
 * @param baseType type you want to provide.
 * @param argumentType type you want to provide @param baseType to.
 */
export function isSubTypeOf(baseType: string, argumentType: LiteralTypes): boolean {
  const type: OverrideType | undefined = isOverrideType(baseType);
  if (!type) {
    return false;
  }
  return type !== 'term' &&
    (extensionTable[type] && extensionTable[type][argumentType] !== undefined);
}

/**
 * Provided a list of Types this will return the most concrete type implemented by all items in that list.
 * @param args
 */
export function typeWidening(...args: LiteralTypes[]): OverrideType {
  if (args.length === 0) {
    throw new Error('Should get at least 1 arg');
  }
  if (args.length === 1) {
    return args[0];
  }
  // We could keep these sorted lists in memory but we don't need them that often?
  const sorted = args.map(overrideType => Object.entries(extensionTable[overrideType])
    .sort(([ typeA, prioA ], [ typeB, prioB ]) => prioA - prioB)
    .map(([ urlType, prio ]) => <OverrideType>urlType));
  let res: OverrideType = 'term';
  let index = 0;
  const max = Math.max(...sorted.map(list => list.length));
  while (index < max) {
    const tempRes: OverrideType = sorted[0][index];
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
export function arithmeticWidening(...args: TypeURL[]): TypeURL {
  const widened = isLiteralType(typeWidening(...args));
  if (!widened) {
    throw new Error('Non arithmetic types where provided');
  }
  const widenedTypeAlias = isTypeAlias(widened);
  const widenedTypeUrl = <TypeURL> widened;
  if (!widenedTypeAlias) {
    return widenedTypeUrl;
  }
  // This follows some rule of importance: most important to least impotent: double, float, decimal, integer
  // Getting here, we know args contains 2 different from list: decimal, float, double.
  // We thus know res is at least a float and might need to be a double
  if (args.includes(TypeURL.XSD_DOUBLE)) {
    return TypeURL.XSD_DOUBLE;
  }
  return TypeURL.XSD_FLOAT;
}
