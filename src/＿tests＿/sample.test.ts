import{ expect, test } from 'vitest';

function sum(a: number, b: number) {
  return a + b;
}

test("足し算のテスト", () => {
  expect(sum(1, 1)).toBe(2);
});