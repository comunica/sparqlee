import { numeric } from '../../util/Aliases';
import { Notation } from '../../util/TestTable';
import type { ITestTableConfigBase } from '../../util/utils';
import { runTestTable } from '../../util/utils';

describe('sparqlStar functions', () => {
  // describe('evaluation of \'isTriple\'', () => {
  //   const baseConfig: ITestTableConfigBase = {
  //     arity: 1,
  //     operation: 'istriple',
  //     notation: Notation.Function,
  //     aliases: numeric,
  //   };
  //   runTestTable({
  //     ...baseConfig,
  //     parserOptions: {
  //       sparqlStar: true,
  //     },
  //     config: {
  //       type: 'sync',
  //       config: {
  //         sparqlStar: true,
  //       },
  //     },
  //     testTable: [
  //       [ '<< <http://example.com> a "a" >>', '"true"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '<http://example.com>', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '<http://example.com/é>', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '1', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '1', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ 'true', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ 'false', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '"a"', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '"a"^^xsd:string', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '"a"@en', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '"a"@en-US', '"false"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [
  //         '<< <http://example.com> <http://example.com> <http://example.com> >>',
  //         '"true"^^http://www.w3.org/2001/XMLSchema#boolean',
  //       ],
  //       [ '<< <http://example.com> a <http://example.com> >>', '"true"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '<< <http://example.com> a true >>', '"true"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '<< <http://example.com> a "a"^^xsd:string >>', '"true"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '<< <http://example.com> a "a"@en-US >>', '"true"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '<< <http://example.com> a "a" >>', '"true"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //     ],
  //   });
  // });

  // describe('evaluation of \'subject\'', () => {
  //   const baseConfig: ITestTableConfigBase = {
  //     arity: 1,
  //     operation: 'subject',
  //     notation: Notation.Function,
  //     aliases: numeric,
  //   };
  //   runTestTable({
  //     ...baseConfig,
  //     parserOptions: {
  //       sparqlStar: true,
  //     },
  //     config: {
  //       type: 'sync',
  //       config: {
  //         sparqlStar: true,
  //       },
  //     },
  //     testTable: [
  //       [ '<< <http://example.com> a "a" >>', 'http://example.com' ],
  //       [ '<< <http://example.com> <http://example.com> <http://example.com> >>', 'http://example.com' ],
  //       [ '<< <http://example.com> a <http://example.com> >>', 'http://example.com' ],
  //       [ '<< <http://example.com> a true >>', 'http://example.com' ],
  //       [ '<< <http://example.com> a "a"^^xsd:string >>', 'http://example.com' ],
  //       [ '<< <http://example.com> a "a"@en-US >>', 'http://example.com' ],
  //       [ '<< <http://example.com> a "a" >>', 'http://example.com' ],
  //     ],
  //     errorTable: [
  //       [ '<http://example.com>', 'Operator "subject" expects a Triple as input, received NamedNode' ],
  //       [ '<http://example.com/é>', 'Operator "subject" expects a Triple as input, received NamedNode' ],
  //       [ '1', 'Operator "subject" expects a Triple as input, received Literal' ],
  //       [ '1', 'Operator "subject" expects a Triple as input, received Literal' ],
  //       [ 'true', 'Operator "subject" expects a Triple as input, received Literal' ],
  //       [ 'false', 'Operator "subject" expects a Triple as input, received Literal' ],
  //       [ '"a"', 'Operator "subject" expects a Triple as input, received Literal' ],
  //       [ '"a"^^xsd:string', 'Operator "subject" expects a Triple as input, received Literal' ],
  //       [ '"a"@en', 'Operator "subject" expects a Triple as input, received Literal' ],
  //       [ '"a"@en-US', 'Operator "subject" expects a Triple as input, received Literal' ],
  //     ],
  //   });
  // });

  // describe('evaluation of \'predicate\'', () => {
  //   const baseConfig: ITestTableConfigBase = {
  //     arity: 1,
  //     operation: 'predicate',
  //     notation: Notation.Function,
  //     aliases: numeric,
  //   };
  //   runTestTable({
  //     ...baseConfig,
  //     parserOptions: {
  //       sparqlStar: true,
  //     },
  //     config: {
  //       type: 'sync',
  //       config: {
  //         sparqlStar: true,
  //       },
  //     },
  //     testTable: [
  //       [ '<< <http://example.com> a "a" >>', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ],
  //       [ '<< <http://example.com> <http://example.com> <http://example.com> >>', 'http://example.com' ],
  //       [ '<< <http://example.com> a <http://example.com> >>', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ],
  //       [ '<< <http://example.com> a true >>', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ],
  //       [ '<< <http://example.com> a "a"^^xsd:string >>', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ],
  //       [ '<< <http://example.com> a "a"@en-US >>', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ],
  //       [ '<< <http://example.com> a "a" >>', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' ],
  //     ],
  //     errorTable: [
  //       [ '<http://example.com>', 'Operator "predicate" expects a Triple as input, received NamedNode' ],
  //       [ '<http://example.com/é>', 'Operator "predicate" expects a Triple as input, received NamedNode' ],
  //       [ '1', 'Operator "predicate" expects a Triple as input, received Literal' ],
  //       [ '1', 'Operator "predicate" expects a Triple as input, received Literal' ],
  //       [ 'true', 'Operator "predicate" expects a Triple as input, received Literal' ],
  //       [ 'false', 'Operator "predicate" expects a Triple as input, received Literal' ],
  //       [ '"a"', 'Operator "predicate" expects a Triple as input, received Literal' ],
  //       [ '"a"^^xsd:string', 'Operator "predicate" expects a Triple as input, received Literal' ],
  //       [ '"a"@en', 'Operator "predicate" expects a Triple as input, received Literal' ],
  //       [ '"a"@en-US', 'Operator "predicate" expects a Triple as input, received Literal' ],
  //     ],
  //   });
  // });

  // describe('evaluation of \'object\'', () => {
  //   const baseConfig: ITestTableConfigBase = {
  //     arity: 1,
  //     operation: 'object',
  //     notation: Notation.Function,
  //     aliases: numeric,
  //   };
  //   runTestTable({
  //     ...baseConfig,
  //     parserOptions: {
  //       sparqlStar: true,
  //     },
  //     config: {
  //       type: 'sync',
  //       config: {
  //         sparqlStar: true,
  //       },
  //     },
  //     testTable: [
  //       [ '<< <http://example.com> a "a" >>', '"a"' ],
  //       [ '<< <http://example.com> <http://example.com> <http://example.com> >>', 'http://example.com' ],
  //       [ '<< <http://example.com> a <http://example.com> >>', 'http://example.com' ],
  //       [ '<< <http://example.com> a true >>', '"true"^^http://www.w3.org/2001/XMLSchema#boolean' ],
  //       [ '<< <http://example.com> a "a"^^xsd:string >>', '"a"^^xsd:string' ],
  //       [ '<< <http://example.com> a "a"@en-US >>', '"a"@en-US' ],
  //       [ '<< <http://example.com> a "a" >>', '"a"' ],
  //     ],
  //     errorTable: [
  //       [ '<http://example.com>', 'Operator "object" expects a Triple as input, received NamedNode' ],
  //       [ '<http://example.com/é>', 'Operator "object" expects a Triple as input, received NamedNode' ],
  //       [ '1', 'Operator "object" expects a Triple as input, received Literal' ],
  //       [ '1', 'Operator "object" expects a Triple as input, received Literal' ],
  //       [ 'true', 'Operator "object" expects a Triple as input, received Literal' ],
  //       [ 'false', 'Operator "object" expects a Triple as input, received Literal' ],
  //       [ '"a"', 'Operator "object" expects a Triple as input, received Literal' ],
  //       [ '"a"^^xsd:string', 'Operator "object" expects a Triple as input, received Literal' ],
  //       [ '"a"@en', 'Operator "object" expects a Triple as input, received Literal' ],
  //       [ '"a"@en-US', 'Operator "object" expects a Triple as input, received Literal' ],
  //     ],
  //   });
  // });


  describe('evaluation of \'triple\'', () => {
    const baseConfig: ITestTableConfigBase = {
      // TODO: Introduce the ability to make this exactly 3
      arity: 'vary',
      operation: 'triple',
      notation: Notation.Function,
      aliases: numeric,
    };
    runTestTable({
      ...baseConfig,
      parserOptions: {
        sparqlStar: true,
      },
      config: {
        type: 'sync',
        config: {
          sparqlStar: true,
        },
      },
      testTable: [
        [ '<http://example.com>', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', '"a"' , '<<<http://example.com> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "a">>' ],
        [ '<http://example.com>', '<http://example.com>', '<http://example.com>', '<<<http://example.com> <http://example.com> <http://example.com>>>' ],
        [ '<http://example.com>', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', 'http://example.com', '<<<http://example.com> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> <http://example.com>>>' ],
        [ '<http://example.com>', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', '"true"^^http://www.w3.org/2001/XMLSchema#boolean', '<<<http://example.com> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> true>>' ],
        [ '<http://example.com>', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', '"a"^^xsd:string', '<<<http://example.com> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "a"^^<http://www.w3.org/2001/XMLSchema#string>>>' ],
        [ '<http://example.com>', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', '"a"@en-US', '<<<http://example.com> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "a"@en-US>>' ],
        [ '<http://example.com>', '<http://www.w3.org/1999/02/22-rdf-syntax-ns#type>', '"a"', '<<<http://example.comm> <http://www.w3.org/1999/02/22-rdf-syntax-ns#type> "a">>' ],
      ],
    });
  });

});
