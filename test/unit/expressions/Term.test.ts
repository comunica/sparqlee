import { NumericLiteral } from '../../../lib/expressions';
import { TypeURL } from '../../../lib/util/Consts';

describe('Term', () => {
  describe('A term expecting to be some type', () => {
    it('checks that type on construction', () => {
      expect(() => new NumericLiteral(5, TypeURL.XSD_STRING)).toThrow('expected a type implementing');
    });
  });
});
