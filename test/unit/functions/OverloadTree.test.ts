import { isLiteralTermExpression, Literal } from '../../../lib/expressions';
import type { IFunctionContext } from '../../../lib/functions';
import { OverloadTree } from '../../../lib/functions';
import type { LiteralTypes } from '../../../lib/util/Consts';
import { TypeURL } from '../../../lib/util/Consts';
import { getDefaultFunctionContext } from '../../util/utils';

describe('OverloadTree', () => {
  let emptyTree: OverloadTree;
  let functionContext: IFunctionContext;
  beforeEach(() => {
    emptyTree = new OverloadTree();
    functionContext = getDefaultFunctionContext();
  });

  function typePromotionTest<T>(tree: OverloadTree, promoteFrom: LiteralTypes, promoteTo: LiteralTypes,
    value: T, valueToEqual?: T) {
    tree.addOverload([ promoteTo ], () => ([ arg ]) => arg);
    const arg = new Literal<T>(value, promoteFrom);
    const res = isLiteralTermExpression(tree.search([ arg ], functionContext.openWorldType)(functionContext)([ arg ]));
    expect(res).toBeTruthy();
    expect(res.dataType).toEqual(promoteTo);
    expect(res.typedValue).toEqual(valueToEqual || value);
  }

  function subtypeSubstitutionTest<T>(tree: OverloadTree, argumentType: LiteralTypes, expectedType: LiteralTypes,
    value: T) {
    tree.addOverload([ expectedType ], () => ([ arg ]) => arg);
    const arg = new Literal<T>(value, argumentType);
    const res = isLiteralTermExpression(tree.search([ arg ], functionContext.openWorldType)(functionContext)([ arg ]));
    expect(res).toBeTruthy();
    expect(res.dataType).toEqual(argumentType);
    expect(res.typedValue).toEqual(value);
  }

  describe('handles Type Promotion', () => {
    it('promotes ANY_URI to STRING', () => {
      typePromotionTest(emptyTree, TypeURL.XSD_ANY_URI, TypeURL.XSD_STRING, 'www.any-uri.com');
    });

    it('promotes FLOAT to DOUBLE', () => {
      typePromotionTest(emptyTree, TypeURL.XSD_FLOAT, TypeURL.XSD_DOUBLE, '0');
    });

    it('promotes DECIMAL to FLOAT', () => {
      typePromotionTest(emptyTree, TypeURL.XSD_DECIMAL, TypeURL.XSD_FLOAT, '0');
    });

    it('promotes DECIMAL to DOUBLE', () => {
      typePromotionTest(emptyTree, TypeURL.XSD_DECIMAL, TypeURL.XSD_DOUBLE, '0');
    });
  });

  describe('handles subtype substitution', () => {
    it('substitutes SHORT into DECIMAL', () => {
      subtypeSubstitutionTest(emptyTree, TypeURL.XSD_SHORT, TypeURL.XSD_DECIMAL, '0');
    });

    it('substitutes TOKEN into STRING', () => {
      subtypeSubstitutionTest(emptyTree, TypeURL.XSD_TOKEN, TypeURL.XSD_STRING, '');
    });
  });

  it('can handle both substitution and promotion at once', () => {
    emptyTree.addOverload([ TypeURL.XSD_DOUBLE ], () => ([ arg ]) => arg);

    const arg = new Literal<number>(0, TypeURL.XSD_SHORT);
    const res = isLiteralTermExpression(emptyTree
      .search([ arg ], functionContext.openWorldType)(functionContext)([ arg ]));
    expect(res).toBeTruthy();
    expect(res.dataType).toEqual(TypeURL.XSD_DOUBLE);
    expect(res.typedValue).toEqual(0);
  });

  it('can handle unknown literal dataType', () => {
    emptyTree.addOverload([ 'term' ], () => ([ arg ]) => arg);
    const dataType = 'www.example.com#weird-string';
    const litValue = 'weird';
    const arg = new Literal<string>(litValue, dataType);
    const res = isLiteralTermExpression(emptyTree
      .search([ arg ], functionContext.openWorldType)(functionContext)([ arg ]));
    expect(res).toBeTruthy();
    expect(res.dataType).toEqual(dataType);
    expect(res.typedValue).toEqual(litValue);
  });
});
