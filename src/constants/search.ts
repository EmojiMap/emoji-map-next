import { env } from '@/env';

/**
 * Configuration constants for search functionality
 * @constant
 * @property {number} DEFAULT_RADIUS_METERS - Default search radius in meters (5km)
 * @property {string} CACHE_KEY - Base key used for caching search results
 * @property {string} CACHE_KEY_VERSION - Version identifier for cache keys from environment
 * @property {number} CACHE_EXPIRATION_TIME - Cache expiration time in milliseconds (30 days)
 * @property {number} LOCATION_DIGITS - Number of decimal places to round location coordinates
 */

export const SEARCH_CONFIG = {
  // We restrict the default included types down to restaurants
  // if they did not specify what they wanted to get back. We
  // exclude 'restaurant' to avoid getting generic places like
  // malls back.
  DEFAULT_INCLUDED_TYPES: [
    'afghani_restaurant',
    'african_restaurant',
    'american_restaurant',
    'asian_restaurant',
    'barbecue_restaurant',
    'brazilian_restaurant',
    'breakfast_restaurant',
    'brunch_restaurant',
    'buffet_restaurant',
    'chinese_restaurant',
    'coffee_shop',
    'dessert_restaurant',
    'fast_food_restaurant',
    'fine_dining_restaurant',
    'french_restaurant',
    'greek_restaurant',
    'hamburger_restaurant',
    'indian_restaurant',
    'indonesian_restaurant',
    'italian_restaurant',
    'japanese_restaurant',
    'korean_restaurant',
    'lebanese_restaurant',
    'mediterranean_restaurant',
    'mexican_restaurant',
    'middle_eastern_restaurant',
    'pizza_restaurant',
    'ramen_restaurant',
    'restaurant',
    'seafood_restaurant',
    'spanish_restaurant',
    'sushi_restaurant',
    'thai_restaurant',
    'turkish_restaurant',
    'vegan_restaurant',
    'vegetarian_restaurant',
    'vietnamese_restaurant',
  ],
  // Remove things like shopping_mall, department_store, etc.
  DEFAULT_EXCLUDED_TYPES: [
    'amusement_center',
    'asian_grocery_store',
    'auto_parts_store',
    'bicycle_store',
    'book_store',
    'bowling_alley',
    'butcher_shop',
    'cell_phone_store',
    'clothing_store',
    'convenience_store',
    'department_store',
    'discount_store',
    'electronics_store',
    'event_venue',
    'furniture_store',
    'gift_shop',
    'grocery_store',
    'hardware_store',
    'home_goods_store',
    'home_improvement_store',
    'jewelry_store',
    'liquor_store',
    'market',
    'pet_store',
    'shoe_store',
    'shopping_mall',
    'sporting_goods_store',
    'supermarket',
    'warehouse_store',
    'wholesaler',
  ],
  DEFAULT_RADIUS_METERS: 5000, // 5 km
  DEFAULT_RECORD_COUNT: 10,
  CACHE_KEY: 'search',
  CACHE_KEY_VERSION: env.SEARCH_CACHE_KEY_VERSION,
  CACHE_EXPIRATION_TIME: 60 * 60 * 24 * 30 * 1000, // 30 days in milliseconds
  LOCATION_DIGITS: 2,
};
