import * as LRUCache from 'lru-cache';
import { TypeURL } from '../../../lib/util/Consts';
import { bool, int, numeric } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import type { ITestTableConfigBase } from '../../util/utils';
import { runTestTable } from '../../util/utils';

describe('string functions', () => {
  describe('evaluation of \'strlen\' like', () => {
    const baseConfig: ITestTableConfigBase = {
      arity: 1,
      operation: 'strlen',
      notation: Notation.Function,
      aliases: numeric,
    };
    runTestTable({
      ...baseConfig,
      testTable: `
        "aaa" = 3i
        "aaaa"@en = 4i
        "aa"^^xsd:string = 2i
        "👪"^^xsd:string = 1i
        "👨‍👩‍👧‍👦"^^xsd:string = ${int('7')}
      `,
    });
    runTestTable({
      ...baseConfig,
      config: {
        type: 'sync',
        config: {
          getSuperType(unknownType) {
            if (unknownType.includes('specialString')) {
              return 'https://example.org/string';
            }
            return TypeURL.XSD_STRING;
          },
          overloadCache: new LRUCache(),
          enableExtendedXsdTypes: true,
        },
      },
      testTable: `
      '"custom type"^^example:string' = ${int('11')}
      "apple"^^example:specialString = ${int('5')}
      `,
    });
  });

  // TODO: PR: I put this here for coverage, I don't know if it's correct
  describe('replace with global option', () => {
    runTestTable({
      operation: 'REPLACE',
      arity: 'vary',
      notation: Notation.Function,
      testTable: `
      "apple" "a" "A" "g" = "Apple"
    `,
    });
  });

  // TODO: Add errors for when non BCP47 strings are passed
  describe('evaluation of \'langMatches\' like', () => {
    runTestTable({
      arity: 2,
      operation: 'langMatches',
      notation: Notation.Function,
      aliases: bool,
      testTable: `
       "de-DE" "de-*-DE" = true
       "de-de" "de-*-DE" = true
       "de-Latn-DE" "de-*-DE" = true
       "de-Latf-DE" "de-*-DE" = true
       "de-DE-x-goethe" "de-*-DE" = true
       "de-Latn-DE-1996" "de-*-DE" = true
       "de" "de-*-DE" = false
       "de-X-De" "de-*-DE" = false
       "de-Deva" "de-*-DE" = false
       "de-de" "be-*-BE" = false
      `,
    });
  });

  describe('evaluations of \'STRSTARTS\' like', () => {
    runTestTable({
      arity: 2,
      aliases: bool,
      operation: 'STRSTARTS',
      notation: Notation.Function,
      testTable: `
        '"some string"' "some" = true
        '"some string"' "Some" = false
        "aaaa"@en "a"@en = true
        "aaaa"@en "b"@en = false
      `,
      errorTable: `
        "aaaa"@en "a"@fr = 'Operation on incompatible language literals'
      `,
    });
  });

  describe('evaluations of \'STRENDS\' like', () => {
    runTestTable({
      arity: 2,
      aliases: bool,
      operation: 'STRENDS',
      notation: Notation.Function,
      testTable: `
        '"some string"' "string" = true
        '"some string"' "strinG" = false
        "aaaa"@en "a"@en = true
        "aaaa"@en "b"@en = false
      `,
      errorTable: `
        "aaaa"@en "a"@fr = 'Operation on incompatible language literals'
      `,
    });
  });

  describe('evaluations of \'CONTAINS\' like', () => {
    runTestTable({
      arity: 2,
      aliases: bool,
      operation: 'CONTAINS',
      notation: Notation.Function,
      testTable: `
        '"some string"' "string" = true
        '"some string"' "strinG" = false
        '"some string"' '"e s"' = true
        "aaaa"@en "a"@en = true
        "aaaa"@en "b"@en = false
      `,
      errorTable: `
        "aaaa"@en "a"@fr = 'Operation on incompatible language literals'
      `,
    });
  });

  describe('evaluations of \'STRBEFORE\' like', () => {
    // Inspired on the specs: https://www.w3.org/TR/sparql11-query/#func-strbefore
    runTestTable({
      arity: 2,
      aliases: bool,
      operation: 'STRBEFORE',
      notation: Notation.Function,
      testTable: `
        "abc" "b" = "a"
        "abc"@en "bc" = "a"@en
        "abc"^^xsd:string "" = ""^^xsd:string
        "abc" "xyz" = ""
        "abc"@en "z"@en = ""
        "abc" "z" = ""
        "abc"@en ""@en = ""@en
        "abc"@en "" = ""@en
      `,
      errorTable: `
        "abc"@en "b"@cy = 'Operation on incompatible language literals'
      `,
    });
  });

  describe('evaluations of \'STRAFTER\' like', () => {
    // Inspired on the specs: https://www.w3.org/TR/sparql11-query/#func-strafter
    runTestTable({
      arity: 2,
      aliases: bool,
      operation: 'STRAFTER',
      notation: Notation.Function,
      testTable: `
        "abc" "b" = "c"
        "abc"@en "ab" = "c"@en
        "abc"^^xsd:string "" = "abc"^^xsd:string
        "abc" "xyz" = ""
        "abc"@en "z"@en = ""
        "abc" "z" = ""
        "abc"@en ""@en = "abc"@en
        "abc"@en "" = "abc"@en
      `,
      errorTable: `
        "abc"@en "b"@cy = 'Operation on incompatible language literals'
      `,
    });
  });

  describe('evaluations of \'substr\' like', () => {
    // Last test is dedicated to type promotion
    runTestTable({
      arity: 'vary',
      operation: 'substr',
      notation: Notation.Function,
      config: {
        type: 'sync',
        config: {
          getSuperType: unknownType => TypeURL.XSD_STRING,
          enableExtendedXsdTypes: true,
        },
      },
      testTable: `
      "bar" 1 1 = "b"
      "bar" 2 = "ar"
      "👪" 2 = ""
      "👨‍👩‍👧‍👦" 2 = "‍👩‍👧‍👦"
      "👪" 1 1 = "👪"
      "👨‍👩‍👧‍👦" 1 1 = "👨"
      "bar"@en 1 1 = "b"@en
      "bar"@en 2 = "ar"@en
      "👪"@en 2 = ""@en
      "👨‍👩‍👧‍👦"@en 2 = "‍👩‍👧‍👦"@en
      "👪"@en 1 1 = "👪"@en
      "👨‍👩‍👧‍👦"@en 1 1 = "👨"@en
      "apple"@en 2 1 = "p"@en
      '"type promotion"^^xsd:anyURI' 2 3 = "ype"
      '"type promotion"^^xsd:anyURI' 6 5 = "promo"
      '"type promotion"^^xsd:anyURI' 6 1 = "p"
      '"custom type"^^example:string' 3 15 = '"stom type"'
      `,
    });
  });

  describe('evaluation of \'regex\' like', () => {
    // TODO: Test better
    runTestTable({
      arity: 2,
      operation: 'regex',
      notation: Notation.Function,
      aliases: bool,
      testTable: `
      "simple" "simple" = true
      "aaaaaa" "a" = true
      "simple" "blurgh" = false
      `,
    });
  });
});
