import { DataFactory } from 'rdf-data-factory';
import type * as RDF from 'rdf-js';

const DF = new DataFactory();

export const TRUE_STR = '"true"^^xsd:boolean';
export const FALSE_STR = '"false"^^xsd:boolean';
export const EVB_ERR_STR = '"not an dateTime"^^xsd:dateTime';

export type LiteralTypes = TypeAlias | TypeURL;

export enum TypeAlias {
  SPARQL_NUMERIC = 'SPARQL_NUMERIC',
  SPARQL_STRINGLY = 'SPARQL_STRINGLY',
  SPARQL_OTHER = 'SPARQL_OTHER',
  SPARQL_NON_LEXICAL = 'SPARQL_NON_LEXICAL',
}

// TODO: Consider inlining all with 'const enum' - do we need to handle this right now? Can this be removed?
export enum TypeURL {
  XSD_ANY_URI = 'http://www.w3.org/2001/XMLSchema#anyURI',
  XSD_STRING = 'http://www.w3.org/2001/XMLSchema#string',
  RDF_LANG_STRING = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#langString',

  XSD_BOOLEAN = 'http://www.w3.org/2001/XMLSchema#boolean',

  XSD_DATE_TIME = 'http://www.w3.org/2001/XMLSchema#dateTime',
  XSD_DATE_TIME_STAMP = 'http://www.w3.org/2001/XMLSchema#dateTimeStamp',
  XSD_DATE = 'http://www.w3.org/2001/XMLSchema#date',

  // Numeric types
  XSD_DECIMAL = 'http://www.w3.org/2001/XMLSchema#decimal',
  XSD_FLOAT = 'http://www.w3.org/2001/XMLSchema#float',
  XSD_DOUBLE = 'http://www.w3.org/2001/XMLSchema#double',

  // Derived numeric types
  XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer',

  XSD_NON_POSITIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#nonPositiveInteger',
  XSD_NEGATIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#negativeInteger',

  XSD_LONG = 'http://www.w3.org/2001/XMLSchema#long',
  XSD_INT = 'http://www.w3.org/2001/XMLSchema#int',
  XSD_SHORT = 'http://www.w3.org/2001/XMLSchema#short',
  XSD_BYTE = 'http://www.w3.org/2001/XMLSchema#byte',

  XSD_NON_NEGATIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#nonNegativeInteger',
  XSD_POSITIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#positiveInteger',
  XSD_UNSIGNED_LONG = 'http://www.w3.org/2001/XMLSchema#unsignedLong',
  XSD_UNSIGNED_INT = 'http://www.w3.org/2001/XMLSchema#unsignedInt',
  XSD_UNSIGNED_SHORT = 'http://www.w3.org/2001/XMLSchema#unsignedShort',
  XSD_UNSIGNED_BYTE = 'http://www.w3.org/2001/XMLSchema#unsignedByte',

  // Derived String Type
  XSD_NORMALIZED_STRING = 'http://www.w3.org/2001/XMLSchema#normalizedString',
  XSD_TOKEN = 'http://www.w3.org/2001/XMLSchema#token',
  XSD_LANGUAGE = 'http://www.w3.org/2001/XMLSchema#language',
  XSD_NM_TOKEN = 'http://www.w3.org/2001/XMLSchema#NMTOKEN',

  XSD_NAME = 'http://www.w3.org/2001/XMLSchema#name',
  XSD_NC_NAME = 'http://www.w3.org/2001/XMLSchema#NCName',
  XSD_ENTITY = 'http://www.w3.org/2001/XMLSchema#ENTITY',
  XSD_ID = 'http://www.w3.org/2001/XMLSchema#ID',
  XSD_ID_REF = 'http://www.w3.org/2001/XMLSchema#IDREF',

  // Other types
  XSD_DURATION = 'http://www.w3.org/2001/XMLSchema#duration',
  XSD_YEAR_MONTH_DURATION = 'http://www.w3.org/2001/XMLSchema#yearMonthDuration',
  XSD_DAYTIME_DURATION = 'http://www.w3.org/2001/XMLSchema#dayTimeDuration',
}

export function make(dt: LiteralTypes): RDF.NamedNode {
  return DF.namedNode(dt);
}

// https://www.w3.org/TR/sparql11-query/#operandDataTypes
export enum NumericTypeURL {
  // Numeric types
  XSD_INTEGER = 'http://www.w3.org/2001/XMLSchema#integer',
  XSD_DECIMAL = 'http://www.w3.org/2001/XMLSchema#decimal',
  XSD_FLOAT = 'http://www.w3.org/2001/XMLSchema#float',
  XSD_DOUBLE = 'http://www.w3.org/2001/XMLSchema#double',

  // Derived numeric types
  XSD_NON_POSITIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#nonPositiveInteger',
  XSD_NEGATIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#negativeInteger',
  XSD_LONG = 'http://www.w3.org/2001/XMLSchema#long',
  XSD_INT = 'http://www.w3.org/2001/XMLSchema#int',
  XSD_SHORT = 'http://www.w3.org/2001/XMLSchema#short',
  XSD_BYTE = 'http://www.w3.org/2001/XMLSchema#byte',
  XSD_NON_NEGATIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#nonNegativeInteger',
  XSD_UNSIGNED_LONG = 'http://www.w3.org/2001/XMLSchema#unsignedLong',
  XSD_UNSIGNED_INT = 'http://www.w3.org/2001/XMLSchema#unsignedInt',
  XSD_UNSIGNED_SHORT = 'http://www.w3.org/2001/XMLSchema#unsignedShort',
  XSD_UNSIGNED_BYTE = 'http://www.w3.org/2001/XMLSchema#unsignedByte',
  XSD_POSITIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#positiveInteger',
}

export enum DerivedIntegerTypeURL {
  XSD_NON_POSITIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#nonPositiveInteger',
  XSD_NEGATIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#negativeInteger',
  XSD_LONG = 'http://www.w3.org/2001/XMLSchema#long',
  XSD_INT = 'http://www.w3.org/2001/XMLSchema#int',
  XSD_SHORT = 'http://www.w3.org/2001/XMLSchema#short',
  XSD_BYTE = 'http://www.w3.org/2001/XMLSchema#byte',
  XSD_NON_NEGATIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#nonNegativeInteger',
  XSD_UNSIGNED_LONG = 'http://www.w3.org/2001/XMLSchema#unsignedLong',
  XSD_UNSIGNED_INT = 'http://www.w3.org/2001/XMLSchema#unsignedInt',
  XSD_UNSIGNED_SHORT = 'http://www.w3.org/2001/XMLSchema#unsignedShort',
  XSD_UNSIGNED_BYTE = 'http://www.w3.org/2001/XMLSchema#unsignedByte',
  XSD_POSITIVE_INTEGER = 'http://www.w3.org/2001/XMLSchema#positiveInteger',
}

export const NumericTypeURLs: Set<string> = new Set(Object.values(NumericTypeURL));
export const DerivedIntegerTypeURLs = new Set(Object.values(DerivedIntegerTypeURL));

export const commonTerms: Record<string, RDF.Term> = {
  true: DF.literal('true', DF.namedNode(TypeURL.XSD_BOOLEAN)),
  false: DF.literal('false', DF.namedNode(TypeURL.XSD_BOOLEAN)),
};

export function type(typeString: string): LiteralTypes {
  return Object.values(TypeURL).includes(<TypeURL> typeString) ? <TypeURL> typeString : TypeAlias.SPARQL_OTHER;
}

// ----------------------------------------------------------------------------
// Operators
// ----------------------------------------------------------------------------

export type OperatorCategory = 'regular' | 'special';
export type Operator = RegularOperator | SpecialOperator;

// TODO: Remove unneeded double typing
export enum RegularOperator {
  // Operator mapping
  // https://www.w3.org/TR/sparql11-query/#OperatorMapping
  NOT = '!',
  UMINUS = 'UMINUS',
  UPLUS = 'UPLUS',
  // LOGICAL_AND // See SpecialOperators
  // LOGICAL_OR  // See SpecialOperators

  EQUAL = '=',
  NOT_EQUAL = '!=',
  LT = '<',
  GT = '>',
  LTE = '<=',
  GTE = '>=',

  MULTIPLICATION = '*',
  DIVISION = '/',
  ADDITION = '+',
  SUBTRACTION = '-',

  // Functional Forms
  // https://www.w3.org/TR/sparql11-query/#func-forms
  // See SpecialOperators

  // Functions on RDF Terms
  // https://www.w3.org/TR/sparql11-query/#func-rdfTerms
  IS_IRI = 'isiri',
  IS_BLANK = 'isblank',
  IS_LITERAL = 'isliteral',
  IS_NUMERIC = 'isnumeric',
  STR = 'str',
  LANG = 'lang',
  DATATYPE = 'datatype',
  // IRI = 'iri', (see special operators)
  // URI = 'uri', (see special operators)
  // BNODE = 'BNODE', (see special operators)
  STRDT = 'strdt',
  STRLANG = 'strlang',
  UUID = 'uuid',
  STRUUID = 'struuid',

  // Functions on strings
  // https://www.w3.org/TR/sparql11-query/#func-strings
  STRLEN = 'strlen',
  SUBSTR = 'substr',
  UCASE = 'ucase',
  LCASE = 'lcase',
  STRSTARTS = 'strstarts',
  STRENDS = 'strends',
  CONTAINS = 'contains',
  STRBEFORE = 'strbefore',
  STRAFTER = 'strafter',
  ENCODE_FOR_URI = 'encode_for_uri',
  // CONCAT = 'concat' (see special operators)
  LANG_MATCHES = 'langmatches',
  REGEX = 'regex',
  REPLACE = 'replace',

  // Functions on numerics
  // https://www.w3.org/TR/sparql11-query/#func-numerics
  ABS = 'abs',
  ROUND = 'round',
  CEIL = 'ceil',
  FLOOR = 'floor',
  RAND = 'rand',

  // Functions on Dates and Times
  // https://www.w3.org/TR/sparql11-query/#func-date-time
  // NOW = 'now' (see special operators)
  YEAR = 'year',
  MONTH = 'month',
  DAY = 'day',
  HOURS = 'hours',
  MINUTES = 'minutes',
  SECONDS = 'seconds',
  TIMEZONE = 'timezone',
  TZ = 'tz',

  // Hash functions
  // https://www.w3.org/TR/sparql11-query/#func-hash
  MD5 = 'md5',
  SHA1 = 'sha1',
  SHA256 = 'sha256',
  SHA384 = 'sha384',
  SHA512 = 'sha512',

  // XPath Constructor functions
  // https://www.w3.org/TR/sparql11-query/#FunctionMapping
  // See Named Operators
}

export enum SpecialOperator {
  // Functional Forms
  // https://www.w3.org/TR/sparql11-query/#func-forms
  BOUND = 'bound',
  IF = 'if',
  COALESCE = 'coalesce',
  // EXISTENCE = 'existence',
  LOGICAL_OR = '||',
  LOGICAL_AND = '&&',
  // EQUAL = '=', // See RegularOperators
  SAME_TERM = 'sameterm',
  IN = 'in',
  NOT_IN = 'notin',

  // Annoying functions - Has variable arity
  CONCAT = 'concat',

  // Context dependant functions
  NOW = 'now',
  IRI = 'iri',
  URI = 'uri',
  BNODE = 'BNODE',
}

export const RegularOperators: Set<string> = new Set(Object.values(RegularOperator));
export const SpecialOperators: Set<string> = new Set(Object.values(SpecialOperator));
export const Operators = new Set([ ...RegularOperators, ...SpecialOperators ]);

export enum SetFunction {
  COUNT = 'count',
  SUM = 'sum',
  MIN = 'min',
  MAX = 'max',
  AVG = 'avg',
  GROUP_CONCAT = 'group_concat',
  SAMPLE = 'sample',
}
export const SetFunctions = new Set(Object.values(SetFunction));

export type NamedOperator =
  // XPath Constructor functions
  // https://www.w3.org/TR/sparql11-query/#FunctionMapping
  TypeURL.XSD_STRING
  | TypeURL.XSD_FLOAT
  | TypeURL.XSD_DOUBLE
  | TypeURL.XSD_DECIMAL
  | TypeURL.XSD_INTEGER
  | TypeURL.XSD_DATE_TIME
  | TypeURL.XSD_DATE
  | TypeURL.XSD_BOOLEAN;

export const NamedOperators = new Set([
  TypeURL.XSD_STRING,
  TypeURL.XSD_FLOAT,
  TypeURL.XSD_DOUBLE,
  TypeURL.XSD_DECIMAL,
  TypeURL.XSD_INTEGER,
  TypeURL.XSD_DATE_TIME,
  TypeURL.XSD_DATE,
  TypeURL.XSD_BOOLEAN,
]);
