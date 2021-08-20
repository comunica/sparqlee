import * as LRUCache from 'lru-cache';
import { IntegerLiteral, isNonLexicalLiteral, NonLexicalLiteral } from '../../../lib/expressions';
import { TypeURL } from '../../../lib/util/Consts';
import type { IOpenWorldTyping } from '../../../lib/util/TypeHandling';

describe('Term', () => {
  describe('has isNonLexicalLiteral function', () => {
    it('detects nonLexicalLiterals', () => {
      const openWorldType: IOpenWorldTyping = {
        discoverer: () => 'term',
        cache: new LRUCache<string, string>(),
      };
      expect(isNonLexicalLiteral(new NonLexicalLiteral(undefined, TypeURL.XSD_DECIMAL, undefined, '1')))
        .toBeTruthy();
    });

    it('detects when literal is not NonLexicalLiteral', () => {
      expect(isNonLexicalLiteral(new IntegerLiteral(1, TypeURL.XSD_INTEGER)))
        .toBeFalsy();
    });
  });
});
