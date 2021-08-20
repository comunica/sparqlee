import type { KnownLiteralTypes } from '../../../lib/util/Consts';
import { TypeAlias, TypeURL } from '../../../lib/util/Consts';
import type { OverrideType } from '../../../lib/util/TypeHandling';
import {
  internalIsSubType,
  isKnownLiteralType,
  isOverrideType, isSubTypeOf,
  isTypeAlias,
} from '../../../lib/util/TypeHandling';
import { getDefaultFunctionContext } from '../../util/utils';

describe('TypeHandling', () => {
  describe('has isTypeAlias function', () => {
    it('can say yes', () => {
      expect(
        [ TypeAlias.SPARQL_NON_LEXICAL, TypeAlias.SPARQL_NUMERIC, TypeAlias.SPARQL_STRINGLY ]
          .every(type => isTypeAlias(type)),
      ).toBeTruthy();
    });
    it('can say no', () => {
      expect(
        [
          '', 'apple', 'not a literal type', 'pear', 'term', TypeURL.XSD_INTEGER, TypeURL.XSD_DECIMAL,
          TypeURL.XSD_BOOLEAN, TypeURL.XSD_DATE_TIME, TypeURL.XSD_DOUBLE, TypeURL.XSD_STRING,
        ].every(type => !isTypeAlias(type)),
      ).toBeTruthy();
    });
  });
  describe('has isLiteralType function', () => {
    it('can say yes', () => {
      expect([ TypeURL.XSD_DECIMAL, TypeURL.XSD_DOUBLE, TypeURL.XSD_YEAR_MONTH_DURATION, TypeURL.RDF_LANG_STRING,
        TypeAlias.SPARQL_NUMERIC, TypeAlias.SPARQL_NON_LEXICAL, TypeAlias.SPARQL_NON_LEXICAL ]
        .every(type => isKnownLiteralType(type))).toBeTruthy();
    });
    it('can say no', () => {
      [ '', 'apple', 'not a literal type', 'pear', 'term' ].every(type => !isKnownLiteralType(type));
    });
  });
  describe('has isOverrideType function', () => {
    it('can say yes', () => {
      expect([ TypeURL.XSD_DECIMAL, TypeURL.XSD_DOUBLE, TypeURL.XSD_YEAR_MONTH_DURATION, TypeURL.RDF_LANG_STRING,
        TypeAlias.SPARQL_NUMERIC, TypeAlias.SPARQL_NON_LEXICAL, TypeAlias.SPARQL_NON_LEXICAL, 'term' ]
        .every(type => isOverrideType(type))).toBeTruthy();
    });
    it('can say no', () => {
      expect([ '', 'apple', 'not a literal type', 'pear' ].every(type => !isOverrideType(type))).toBeTruthy();
    });
  });

  describe('has internalIsSubType function', () => {
    it('can say yes', () => {
      const testArray: [OverrideType, KnownLiteralTypes][] = [
        [ TypeURL.XSD_STRING, TypeURL.XSD_STRING ], [ TypeURL.XSD_SHORT, TypeURL.XSD_INT ],
      ];
      expect(testArray.every(([ baseType, argumentType ]) => internalIsSubType(baseType, argumentType))).toBeTruthy();
    });
    it('can say no', () => {
      const testArray: [OverrideType, KnownLiteralTypes][] = [
        [ 'term', TypeAlias.SPARQL_NON_LEXICAL ], [ 'term', TypeURL.XSD_STRING ],
        [ TypeURL.XSD_BOOLEAN, TypeURL.XSD_DOUBLE ], [ TypeURL.XSD_FLOAT, TypeURL.XSD_DOUBLE ],
      ];
      expect(testArray.every(([ baseType, argumentType ]) => !internalIsSubType(baseType, argumentType))).toBeTruthy();
    });
  });

  describe('has isSubTypeOf function', () => {
    it('can say yes', () => {
      const testArray: [OverrideType, KnownLiteralTypes][] = [
        [ TypeURL.XSD_STRING, TypeURL.XSD_STRING ], [ TypeURL.XSD_SHORT, TypeURL.XSD_INT ],
      ];
      expect(testArray.every(([ baseType, argumentType ]) =>
        isSubTypeOf(baseType, argumentType, getDefaultFunctionContext().openWorldType))).toBeTruthy();
    });
    it('can say no', () => {
      const testArray: [OverrideType, KnownLiteralTypes][] = [
        [ 'term', TypeAlias.SPARQL_NON_LEXICAL ], [ 'term', TypeURL.XSD_STRING ],
        [ TypeURL.XSD_BOOLEAN, TypeURL.XSD_DOUBLE ], [ TypeURL.XSD_FLOAT, TypeURL.XSD_DOUBLE ],
      ];
      expect(testArray.every(([ baseType, argumentType ]) =>
        !isSubTypeOf(baseType, argumentType, getDefaultFunctionContext().openWorldType))).toBeTruthy();
    });
  });
});
