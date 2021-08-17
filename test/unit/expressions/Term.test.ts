import { isNonLexicalLiteral, NonLexicalLiteral, NumericLiteral } from '../../../lib/expressions';
import { TypeURL } from '../../../lib/util/Consts';

describe('Term', () => {
  describe('A term expecting to be some type', () => {
    it('checks that type on construction', () => {
      expect(() =>
        new NumericLiteral(5, TypeURL.XSD_STRING)).toThrow('expected a type implementing');
    });
  });
  describe('has isNonLexicalLiteral function', () => {
    it('detects nonLexicalLiterals', () => {
      expect(isNonLexicalLiteral(new NonLexicalLiteral(undefined, TypeURL.XSD_DECIMAL, '1')))
        .toBeTruthy();
    });

    it('detects when literal is not NonLexicalLiteral', () => {
      expect(isNonLexicalLiteral(new NumericLiteral(1, TypeURL.XSD_INTEGER)))
        .toBeFalsy();
    });
  });
});
