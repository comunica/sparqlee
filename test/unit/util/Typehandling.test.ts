import type { LiteralTypes } from '../../../lib/util/Consts';
import { TypeAlias, TypeURL } from '../../../lib/util/Consts';
import {
  arithmeticWidening,
  isLiteralType,
  isOverrideType,
  isSubTypeOf,
  typeWidening,
} from '../../../lib/util/TypeHandling';

describe('TypeHandling', () => {
  describe('has isLiteralType function', () => {
    it('can say yes', () => {
      [ TypeURL.XSD_DECIMAL, TypeURL.XSD_DOUBLE, TypeURL.XSD_YEAR_MONTH_DURATION, TypeURL.RDF_LANG_STRING,
        TypeAlias.SPARQL_NUMERIC, TypeAlias.SPARQL_NON_LEXICAL, TypeAlias.SPARQL_NON_LEXICAL ]
        .every(type => isLiteralType(type));
    });
    it('can say no', () => {
      [ '', 'apple', 'not a literal type', 'pear', 'term' ].every(type => !isLiteralType(type));
    });
  });
  describe('has isOverrideType function', () => {
    it('can say yes', () => {
      [ TypeURL.XSD_DECIMAL, TypeURL.XSD_DOUBLE, TypeURL.XSD_YEAR_MONTH_DURATION, TypeURL.RDF_LANG_STRING,
        TypeAlias.SPARQL_NUMERIC, TypeAlias.SPARQL_NON_LEXICAL, TypeAlias.SPARQL_NON_LEXICAL, 'term' ]
        .every(type => isOverrideType(type));
    });
    it('can say no', () => {
      [ '', 'apple', 'not a literal type', 'pear' ].every(type => !isOverrideType(type));
    });
  });

  describe('has isSubTypeOf function', () => {
    it('can say yes', () => {
      const testArray: [string, LiteralTypes][] = [
        [ TypeURL.XSD_STRING, TypeURL.XSD_STRING ], [ TypeURL.XSD_SHORT, TypeURL.XSD_INT ],
      ];
      testArray.every(([ baseType, argumentType ]) => isSubTypeOf(baseType, argumentType));
    });
    it('can say no', () => {
      const testArray: [string, LiteralTypes][] = [
        [ 'term', TypeAlias.SPARQL_NON_LEXICAL ], [ 'term', TypeURL.XSD_STRING ], [ 'banana', TypeURL.XSD_DOUBLE ],
        [ TypeURL.XSD_FLOAT, TypeURL.XSD_DOUBLE ],
      ];
      testArray.every(([ baseType, argumentType ]) => !isSubTypeOf(baseType, argumentType));
    });
  });

  describe('has typeWidening function', () => {
    it('Throws error when not provided sufficient arguments', () => {
      expect(() => typeWidening()).toThrow('at least 1 arg');
    });

    it('Doesnt widen when provided one arg', () => {
      const type = TypeURL.XSD_STRING;
      expect(typeWidening(type)).toEqual(type);
    });
  });

  describe('has arithmeticWidening function', () => {
    it('Throws error when provided wrong arguments', () => {
      expect(() => arithmeticWidening(TypeURL.XSD_DATE_TIME, TypeURL.XSD_DOUBLE))
        .toThrow('Non arithmetic types where provided');
    });

    it('Has weird widening rules', () => {
      expect(arithmeticWidening(TypeURL.XSD_DOUBLE, TypeURL.XSD_FLOAT)).toEqual(TypeURL.XSD_DOUBLE);
      expect(arithmeticWidening(TypeURL.XSD_FLOAT, TypeURL.XSD_DECIMAL)).toEqual(TypeURL.XSD_FLOAT);
      expect(arithmeticWidening(TypeURL.XSD_INTEGER, TypeURL.XSD_DECIMAL)).toEqual(TypeURL.XSD_DECIMAL);
      expect(arithmeticWidening(TypeURL.XSD_INTEGER, TypeURL.XSD_INTEGER)).toEqual(TypeURL.XSD_INTEGER);
    });
  });
});
