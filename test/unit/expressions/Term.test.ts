import { IntegerLiteral, isNonLexicalLiteral, NonLexicalLiteral } from '../../../lib/expressions';
import { TypeURL } from '../../../lib/util/Consts';
import type { IOpenWorldEnabler } from '../../../lib/util/TypeHandling';
import { getDefaultFunctionContext } from '../../util/utils';

describe('Term', () => {
  describe('has isNonLexicalLiteral function', () => {
    it('detects nonLexicalLiterals', () => {
      const openWorldType: IOpenWorldEnabler = getDefaultFunctionContext().openWorldEnabler;
      expect(isNonLexicalLiteral(new NonLexicalLiteral(undefined, TypeURL.XSD_DECIMAL, undefined, '1')))
        .toBeTruthy();
    });

    it('detects when literal is not NonLexicalLiteral', () => {
      expect(isNonLexicalLiteral(new IntegerLiteral(1, TypeURL.XSD_INTEGER)))
        .toBeFalsy();
    });
  });
});
