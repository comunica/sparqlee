import type { Builder } from '../../../lib/functions/Helpers';
import { bool, declare } from '../../../lib/functions/Helpers';
import { TypeURL } from '../../../lib/util/Consts';
import fn = jest.fn;

describe('The function helper file', () => {
  describe('has a builder', () => {
    let builder: Builder;

    beforeEach(() => {
      builder = declare();
    });

    it('can only be collected once', () => {
      builder.collect();
      expect(() => builder.collect()).toThrow('only be collected once');
    });

    it('throws error when copy is not possible', () => {
      expect(() =>
        builder.copy({ from: [ 'term' ], to: [ TypeURL.XSD_STRING ]})).toThrow('types not found');
    });

    it('defines a function onUnaryTyped', () => {
      const func = fn();
      const args = [ bool(true) ];
      builder.onUnaryTyped(TypeURL.XSD_BOOLEAN, func).collect().search(args)(args);
      expect(func).toBeCalledTimes(1);
    });

    it('defines a function onBoolean1', () => {
      const func = fn();
      const args = [ bool(true) ];
      builder.onBoolean1(func).collect().search(args)(args);
      expect(func).toBeCalledTimes(1);
    });
  });
});
