import { describe, expect, test, vi } from 'vitest';
import { getEmojiForTypes } from './get-emoji-for-types';

// Mock the category map
vi.mock('@/constants/category-map', () => ({
  CATEGORY_MAP: [
    {
      key: 1,
      primaryType: ['restaurant'],
      emoji: '🍽️',
    },
    {
      key: 2,
      primaryType: ['cafe'],
      emoji: '☕',
    },
    {
      key: 3,
      primaryType: ['pizza_restaurant'],
      emoji: '🍕',
    },
  ],
  EMOJI_OVERRIDES: {
    'pizza hut': '🍕',
    'jamba juice': '🧃',
    'smoothie king': '🥤',
    "mcdonald's": '🍔',
    "dave's hot chicken": '🍗',
    "carl's jr": '🍔',
  },
}));

describe('getEmojiForTypes', () => {
  test('returns correct emoji for pizza restaurant type', () => {
    const types = ['pizza_restaurant'];
    expect(getEmojiForTypes('', types, [])).toBe('🍕');
  });

  test('returns correct emoji for cafe type', () => {
    const types = ['cafe'];
    expect(getEmojiForTypes('', types, [])).toBe('☕');
  });

  test('returns correct emoji when multiple types are provided', () => {
    const types = ['restaurant', 'pizza_restaurant'];
    expect(getEmojiForTypes('', types, [])).toBe('🍽️');
  });

  test('returns default emoji when no matching type is found', () => {
    const types = ['unknown_type'];
    expect(getEmojiForTypes('', types, [])).toBe('😶‍🌫️');
  });

  test('returns default emoji for empty types array', () => {
    const types: string[] = [];
    expect(getEmojiForTypes('', types, [])).toBe('😶‍🌫️');
  });

  test('matches first found category when multiple matches are possible', () => {
    const types = ['restaurant', 'pizza_restaurant'];
    expect(getEmojiForTypes('', types, [])).toBe('🍽️');
  });

  describe('type restrictions', () => {
    test('only matches types from specified categories when restriction provided', () => {
      const types = ['restaurant', 'cafe'];
      expect(getEmojiForTypes('', types, [1])).toBe('🍽️'); // Should only match restaurant
      expect(getEmojiForTypes('', types, [2])).toBe('☕'); // Should only match cafe
    });

    test('returns default emoji when type not in restricted categories', () => {
      const types = ['restaurant'];
      expect(getEmojiForTypes('', types, [2])).toBe('😶‍🌫️'); // Category 2 doesn't include restaurants
    });

    test('matches any category when no restrictions provided', () => {
      const types = ['restaurant', 'cafe'];
      expect(getEmojiForTypes('', types, [])).toBe('🍽️'); // Should match first type
    });
  });

  describe('name overrides', () => {
    test('returns override emoji for exact name match regardless of type restrictions', () => {
      expect(getEmojiForTypes('Pizza Hut', ['restaurant'], [2])).toBe('🍕');
      expect(getEmojiForTypes('Jamba Juice', ['juice_shop'], [1])).toBe('🧃');
      expect(getEmojiForTypes('Smoothie King', ['juice_shop'], [])).toBe('🥤');
    });

    test('returns override emoji regardless of case', () => {
      expect(getEmojiForTypes('pizza hut', ['restaurant'], [])).toBe('🍕');
      expect(getEmojiForTypes('PIZZA HUT', ['restaurant'], [])).toBe('🍕');
      expect(getEmojiForTypes('PiZzA hUt', ['restaurant'], [])).toBe('🍕');
    });

    test('falls back to type matching when no name override exists', () => {
      expect(
        getEmojiForTypes('Generic Pizza Place', ['pizza_restaurant'], [])
      ).toBe('🍕');
      expect(getEmojiForTypes('Local Coffee Shop', ['cafe'], [])).toBe('☕');
    });

    test('name override takes precedence over type matching', () => {
      expect(getEmojiForTypes('Jamba Juice', ['cafe'], [])).toBe('🧃');
      expect(getEmojiForTypes("McDonald's", ['restaurant'], [])).toBe('🍔');
    });

    test('handles special characters in name overrides', () => {
      expect(getEmojiForTypes("Dave's Hot Chicken", ['restaurant'], [])).toBe(
        '🍗'
      );
      expect(getEmojiForTypes("Carl's Jr", ['restaurant'], [])).toBe('🍔');
    });
  });
});
