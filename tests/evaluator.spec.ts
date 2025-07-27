/**
 * Unit tests for ConditionOperatorRegistry and defaultConditionOperators
 */
import { ConditionOperatorRegistry, defaultConditionOperators } from '../src/core/evaluator';

describe('ConditionOperatorRegistry', () => {
  it('should register and retrieve operators', () => {
    const registry = new ConditionOperatorRegistry();
    const op = jest.fn();
    registry.register('custom', op);
    expect(registry.get('custom')).toBe(op);
  });

  it('should return undefined for unknown operator', () => {
    const registry = new ConditionOperatorRegistry();
    expect(registry.get('nope')).toBeUndefined();
  });

  it('should return all registered operators', () => {
    const registry = new ConditionOperatorRegistry();
    const op1 = jest.fn();
    const op2 = jest.fn();
    registry.register('a', op1);
    registry.register('b', op2);
    const all = registry.all();
    expect(all).toHaveProperty('a', op1);
    expect(all).toHaveProperty('b', op2);
  });
});

describe('defaultConditionOperators', () => {
  it('eq operator should compare equality', () => {
    expect(defaultConditionOperators.eq('foo', 1, { foo: 1 })).toBe(true);
    expect(defaultConditionOperators.eq('foo', 2, { foo: 1 })).toBe(false);
  });

  it('in operator should check inclusion', () => {
    expect(defaultConditionOperators.in('foo', [1, 2, 3], { foo: 2 })).toBe(true);
    expect(defaultConditionOperators.in('foo', [1, 2, 3], { foo: 4 })).toBe(false);
    expect(defaultConditionOperators.in('foo', 'not-an-array', { foo: 2 })).toBe(false);
  });
  
  const context = {
    a: 5,
    b: 10,
    s: 'hello world',
    arr: [1, 2, 3],
    strArr: ['foo', 'bar'],
    regexStr: 'abc123',
  };

  it('eq: should return true if equal', () => {
    expect(defaultConditionOperators.eq('a', 5, context)).toBe(true);
    expect(defaultConditionOperators.eq('s', 'hello world', context)).toBe(true);
    expect(defaultConditionOperators.eq('a', 6, context)).toBe(false);
  });

  it('ne: should return true if not equal', () => {
    expect(defaultConditionOperators.ne('a', 6, context)).toBe(true);
    expect(defaultConditionOperators.ne('s', 'nope', context)).toBe(true);
    expect(defaultConditionOperators.ne('a', 5, context)).toBe(false);
  });

  it('gt: should return true if greater than', () => {
    expect(defaultConditionOperators.gt('b', 5, context)).toBe(true);
    expect(defaultConditionOperators.gt('a', 5, context)).toBe(false);
    expect(defaultConditionOperators.gt('a', 6, context)).toBe(false);
  });

  it('lt: should return true if less than', () => {
    expect(defaultConditionOperators.lt('a', 6, context)).toBe(true);
    expect(defaultConditionOperators.lt('a', 5, context)).toBe(false);
    expect(defaultConditionOperators.lt('b', 5, context)).toBe(false);
  });

  it('gte: should return true if greater than or equal', () => {
    expect(defaultConditionOperators.gte('a', 5, context)).toBe(true);
    expect(defaultConditionOperators.gte('b', 5, context)).toBe(true);
    expect(defaultConditionOperators.gte('a', 6, context)).toBe(false);
  });

  it('lte: should return true if less than or equal', () => {
    expect(defaultConditionOperators.lte('a', 5, context)).toBe(true);
    expect(defaultConditionOperators.lte('a', 6, context)).toBe(true);
    expect(defaultConditionOperators.lte('b', 5, context)).toBe(false);
  });

  it('in: should return true if context value is in array', () => {
    expect(defaultConditionOperators.in('a', [1, 2, 5], context)).toBe(true);
    expect(defaultConditionOperators.in('s', ['no', 'hello world'], context)).toBe(true);
    expect(defaultConditionOperators.in('a', [6, 7], context)).toBe(false);
  });

  it('contains: should return true if context value contains value', () => {
    expect(defaultConditionOperators.contains('s', 'world', context)).toBe(true);
    expect(defaultConditionOperators.contains('arr', 2, context)).toBe(true);
    expect(defaultConditionOperators.contains('arr', 5, context)).toBe(false);
    expect(defaultConditionOperators.contains('s', 'nope', context)).toBe(false);
  });

  it('regex: should return true if context value matches regex', () => {
    expect(defaultConditionOperators.regex('regexStr', /^abc\d+$/, context)).toBe(true);
    // Use a simple pattern that works as a string and RegExp
    expect(defaultConditionOperators.regex('regexStr', 'abc', context)).toBe(true);
    expect(defaultConditionOperators.regex('regexStr', /^def/, context)).toBe(false);
    expect(defaultConditionOperators.regex('regexStr', '[', context)).toBe(false); // invalid regex
  });
});
