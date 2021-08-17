import { isLiteralTermExpression, Literal } from '../../../lib/expressions';
import { OverloadTree } from '../../../lib/functions';
import type { LiteralTypes } from '../../../lib/util/Consts';
import { TypeURL } from '../../../lib/util/Consts';

function typePromotionTest<T>(tree: OverloadTree, promoteFrom: LiteralTypes, promoteTo: LiteralTypes,
  value: T, valueToEqual?: T) {
  tree.addOverload([ promoteTo ], ([ arg ]) => arg);
  const arg = new Literal<T>(value, promoteFrom);
  const res = isLiteralTermExpression(tree.search([ arg ])([ arg ]));
  expect(res).toBeTruthy();
  expect(res.dataType).toEqual(promoteTo);
  expect(res.typedValue).toEqual(valueToEqual || value);
}

function subtypeSubstitutionTest<T>(tree: OverloadTree, argumentType: LiteralTypes, expectedType: LiteralTypes,
  value: T) {
  tree.addOverload([ expectedType ], ([ arg ]) => arg);
  const arg = new Literal<T>(value, argumentType);
  const res = isLiteralTermExpression(tree.search([ arg ])([ arg ]));
  expect(res).toBeTruthy();
  expect(res.dataType).toEqual(argumentType);
  expect(res.typedValue).toEqual(value);
}

describe('OverloadTree', () => {
  let tree: OverloadTree;

  beforeEach(() => {
    tree = new OverloadTree();
  });

  describe('handles Type Promotion', () => {
    it('promotes ANY_URI to STRING', () => {
      typePromotionTest(tree, TypeURL.XSD_ANY_URI, TypeURL.XSD_STRING, 'www.any-uri.com');
    });

    it('promotes FLOAT to DOUBLE', () => {
      typePromotionTest(tree, TypeURL.XSD_FLOAT, TypeURL.XSD_DOUBLE, '0');
    });

    it('promotes DECIMAL to FLOAT', () => {
      typePromotionTest(tree, TypeURL.XSD_DECIMAL, TypeURL.XSD_FLOAT, '0');
    });

    it('promotes DECIMAL to DOUBLE', () => {
      typePromotionTest(tree, TypeURL.XSD_DECIMAL, TypeURL.XSD_DOUBLE, '0');
    });
  });

  describe('handles subtype substitution', () => {
    it('substitutes SHORT into DECIMAL', () => {
      subtypeSubstitutionTest(tree, TypeURL.XSD_SHORT, TypeURL.XSD_DECIMAL, '0');
    });

    it('substitutes TOKEN into STRING', () => {
      subtypeSubstitutionTest(tree, TypeURL.XSD_TOKEN, TypeURL.XSD_STRING, '');
    });
  });

  it('can handle both substitution and promotion at once', () => {
    tree.addOverload([ TypeURL.XSD_DOUBLE ], ([ arg ]) => arg);

    const arg = new Literal<number>(0, TypeURL.XSD_SHORT);
    const res = isLiteralTermExpression(tree.search([ arg ])([ arg ]));
    expect(res).toBeTruthy();
    expect(res.dataType).toEqual(TypeURL.XSD_DOUBLE);
    expect(res.typedValue).toEqual(0);
  });

  it('can handle unknown literal dataType', () => {
    tree.addOverload([ 'term' ], ([ arg ]) => arg);
    const dataType = 'www.example.com#weird-string';
    const litValue = 'weird';
    const arg = new Literal<string>(litValue, dataType);
    const res = isLiteralTermExpression(tree.search([ arg ])([ arg ]));
    expect(res).toBeTruthy();
    expect(res.dataType).toEqual(dataType);
    expect(res.typedValue).toEqual(litValue);
  });
});
