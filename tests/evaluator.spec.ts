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
});
