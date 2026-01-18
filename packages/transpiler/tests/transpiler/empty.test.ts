import { describe, it } from 'vitest';
import { expectCSharp, GENERATED_HEADER } from '../helpers.js';

describe('Empty File Transpilation', () => {
  it('should produce CS with only header comment for empty TS file', () => {
    const input = '';
    const expected = GENERATED_HEADER;

    expectCSharp(input, expected);
  });

  it('should produce CS with only header for TS with only line comments', () => {
    const input = `// This is a comment
// Another comment`;
    const expected = GENERATED_HEADER;

    expectCSharp(input, expected);
  });

  it('should produce CS with only header for TS with only block comments', () => {
    const input = `/* Block comment */
/* 
  Multi-line
  block comment
*/`;
    const expected = GENERATED_HEADER;

    expectCSharp(input, expected);
  });

  it('should produce CS with only header for TS with mixed comments', () => {
    const input = `// Line comment
/* Block comment */
// Another line comment`;
    const expected = GENERATED_HEADER;

    expectCSharp(input, expected);
  });

  it('should produce CS with only header for TS with only whitespace', () => {
    const input = `   
    
  `;
    const expected = GENERATED_HEADER;

    expectCSharp(input, expected);
  });
});

