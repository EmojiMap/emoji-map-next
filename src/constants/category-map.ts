/**
 * Category mapping for places
 *
 * This map defines categories for places with associated emojis and keywords.
 * Used for categorizing and displaying places on the map and in search results.
 *
 * Each category has:
 * @property {number} key - Unique identifier for the category
 * @property {string} emoji - Emoji representation of the category
 * @property {string} name - Name of the category
 * @property {string[]} keywords - Related keywords for matching places to this category
 * @property {string[]} primaryType - Primary Google Places types for this category
 * @property {string[]} examples - Example restaurant names that should match this category (case insensitive)
 */
export const CATEGORY_MAP = [
  {
    key: 1,
    emoji: '🍕',
    name: 'pizza',
    keywords: ['italian', 'pepperoni', 'cheese', 'pasta', 'calzone'],
    primaryType: ['pizza_restaurant', 'italian_restaurant'],
  },
  {
    key: 2,
    emoji: '🍺',
    name: 'beer',
    keywords: ['brewery', 'pub', 'ale', 'lager', 'bar'],
    primaryType: ['pub', 'bar'],
  },
  {
    key: 3,
    emoji: '🍣',
    name: 'sushi',
    keywords: ['japanese', 'sashimi', 'roll', 'tempura', 'miso'],
    primaryType: ['sushi_restaurant', 'japanese_restaurant'],
  },
  {
    key: 4,
    emoji: '☕',
    name: 'coffee',
    keywords: ['cafe', 'espresso', 'latte', 'pastry', 'mocha'],
    primaryType: ['coffee_shop', 'cafe'],
  },
  {
    key: 5,
    emoji: '🍔',
    name: 'burger',
    keywords: ['fries', 'diner', 'cheeseburger', 'shake', 'grill', 'burger'],
    primaryType: [
      'fast_food_restaurant', // Fast Food Restaurant
      'hamburger_restaurant',
      'american_restaurant',
      'diner',
    ],
  },
  {
    key: 6,
    emoji: '🌮',
    name: 'mexican',
    keywords: ['taco', 'burrito', 'salsa', 'guacamole', 'enchilada'],
    primaryType: ['mexican_restaurant'],
  },
  {
    key: 7,
    emoji: '🍜',
    name: 'ramen',
    keywords: ['noodle', 'broth', 'japanese', 'miso', 'tonkotsu'],
    primaryType: [
      'ramen_restaurant',
      'japanese_restaurant',
      'korean_restaurant',
      'thai_restaurant',
      'vietnamese_restaurant',
    ],
  },
  {
    key: 8,
    emoji: '🥗',
    name: 'salad',
    keywords: ['healthy', 'greens', 'dressing', 'veggie', 'bowl'],
    primaryType: ['vegan_restaurant', 'vegetarian_restaurant'],
  },
  {
    key: 9,
    emoji: '🍦',
    name: 'dessert',
    keywords: [
      'cake',
      'ice cream',
      'pastry',
      'sweet',
      'cookie',
      'crepe',
      'crepes',
    ],
    primaryType: ['dessert_restaurant', 'ice_cream_shop'],
  },
  {
    key: 10,
    emoji: '🍷',
    name: 'wine',
    keywords: ['vineyard', 'bar', 'red', 'white', 'tasting'],
    primaryType: ['wine_bar'],
  },
  {
    key: 11,
    emoji: '🍲',
    name: 'asian_fusion',
    keywords: ['thai', 'vietnamese', 'korean', 'chinese', 'noodle'],
    primaryType: [
      'asian_restaurant',
      'thai_restaurant',
      'vietnamese_restaurant',
      'korean_restaurant',
    ],
  },
  {
    key: 12,
    emoji: '🥪',
    name: 'sandwich',
    keywords: ['deli', 'sub', 'bread', 'panini', 'bodega'],
    primaryType: ['sandwich_shop', 'deli'],
  },
  {
    key: 13,
    emoji: '🍝',
    name: 'italian',
    keywords: ['pasta', 'pizza', 'risotto', 'lasagna', 'gelato'],
    primaryType: ['italian_restaurant'],
  },
  {
    key: 14,
    emoji: '🥩',
    name: 'steak',
    keywords: ['grill', 'beef', 'ribeye', 'sirloin', 'barbecue'],
    primaryType: ['steak_house'],
  },
  {
    key: 15,
    emoji: '🍗',
    name: 'chicken',
    keywords: ['fried', 'grilled', 'wings', 'nuggets', 'roast', 'chick'],
    primaryType: ['brazilian_restaurant', 'fast_food_restaurant'],
  },
  {
    key: 16,
    emoji: '🍤',
    name: 'seafood',
    keywords: ['shrimp', 'fish', 'crab', 'lobster', 'oyster'],
    primaryType: ['seafood_restaurant', 'spanish_restaurant'],
  },
  {
    key: 17,
    emoji: '🍛',
    name: 'indian',
    keywords: ['curry', 'naan', 'tandoori', 'biryani', 'samosa'],
    primaryType: ['indian_restaurant'],
  },
  {
    key: 18,
    emoji: '🥘',
    name: 'spanish',
    keywords: ['paella', 'tapas', 'chorizo', 'sangria', 'churros'],
    primaryType: ['spanish_restaurant'],
  },
  {
    key: 19,
    emoji: '🍱',
    name: 'japanese',
    keywords: ['sushi', 'ramen', 'tempura', 'teriyaki', 'sake'],
    primaryType: ['japanese_restaurant'],
  },
  {
    key: 20,
    emoji: '🥟',
    name: 'chinese',
    keywords: ['dumpling', 'noodle', 'fried rice', 'dim sum', 'sweet and sour'],
    primaryType: ['chinese_restaurant'],
  },
  {
    key: 21,
    emoji: '🧆',
    name: 'middle_eastern',
    keywords: ['falafel', 'hummus', 'kebab', 'shawarma', 'baklava'],
    primaryType: [
      'middle_eastern_restaurant',
      'lebanese_restaurant',
      'turkish_restaurant',
    ],
  },
  {
    key: 22,
    emoji: '🥐',
    name: 'bakery',
    keywords: ['bread', 'pastry', 'croissant', 'cake', 'muffin'],
    primaryType: ['bakery', 'french_restaurant'],
  },
  {
    key: 23,
    emoji: '🍨',
    name: 'ice_cream',
    keywords: ['gelato', 'sundae', 'frozen yogurt', 'sorbet', 'cone'],
    primaryType: ['ice_cream_shop'],
  },
  {
    key: 24,
    emoji: '🍹',
    name: 'cocktail',
    keywords: ['bar', 'mixology', 'mojito', 'martini', 'margarita'],
    primaryType: ['bar'],
  },
  {
    key: 25,
    emoji: '🍽️',
    name: 'place',
    keywords: ['restaurant', 'eatery', 'diner', 'cafe', 'bistro'],
    primaryType: ['restaurant', 'food_court', 'buffet_restaurant'],
  },
  {
    key: 26,
    emoji: '🥣',
    name: 'acai',
    keywords: ['bowl', 'berry', 'healthy', 'smoothie', 'fruit'],
    primaryType: ['acai_shop'],
  },
  {
    key: 27,
    emoji: '🍖',
    name: 'barbecue',
    keywords: ['meat', 'grill', 'ribs', 'smoke', 'sauce'],
    primaryType: ['barbecue_restaurant', 'afghani_restaurant'],
  },
  {
    key: 28,
    emoji: '🥯',
    name: 'bagel',
    keywords: ['bread', 'cream cheese', 'breakfast', 'deli', 'toasted'],
    primaryType: ['bagel_shop'],
  },
  {
    key: 29,
    emoji: '🥞',
    name: 'breakfast',
    keywords: ['pancakes', 'eggs', 'bacon', 'waffles', 'coffee'],
    primaryType: ['breakfast_restaurant'],
  },
  {
    key: 30,
    emoji: '🍳',
    name: 'brunch',
    keywords: ['eggs', 'toast', 'mimosa', 'pancakes', 'coffee'],
    primaryType: ['brunch_restaurant'],
  },
  {
    key: 31,
    emoji: '🍬',
    name: 'candy',
    keywords: ['sweets', 'gummies', 'chocolate', 'lollipop', 'sugar'],
    primaryType: ['candy_store'],
  },
  {
    key: 32,
    emoji: '🐱',
    name: 'cat_cafe',
    keywords: ['cats', 'coffee', 'tea', 'pets', 'relax'],
    primaryType: ['cat_cafe'],
  },
  {
    key: 33,
    emoji: '🍫',
    name: 'chocolate',
    keywords: ['cocoa', 'truffles', 'bars', 'dessert', 'sweet'],
    primaryType: ['chocolate_shop', 'chocolate_factory'],
  },
  {
    key: 34,
    emoji: '🍭',
    name: 'confectionery',
    keywords: ['candy', 'sweets', 'lollipop', 'fudge', 'toffee', 'yogurt'],
    primaryType: ['confectionery'],
  },
  {
    key: 35,
    emoji: '🐶',
    name: 'dog_cafe',
    keywords: ['dogs', 'coffee', 'tea', 'pets', 'relax'],
    primaryType: ['dog_cafe'],
  },
  {
    key: 36,
    emoji: '🍩',
    name: 'donut',
    keywords: ['doughnut', 'glaze', 'sprinkles', 'pastry', 'coffee'],
    primaryType: ['donut_shop', 'dessert_shop'],
  },
  {
    key: 37,
    emoji: '🍟',
    name: 'fast_food',
    keywords: ['fries', 'burger', 'chicken', 'drive-thru', 'quick'],
    primaryType: ['fast_food_restaurant'],
  },
  {
    key: 38,
    emoji: '🍴',
    name: 'fine_dining',
    keywords: [
      'gourmet',
      'elegant',
      'chef',
      'tasting',
      'luxury',
      'fine dining',
    ],
    primaryType: ['fine_dining_restaurant'],
  },
  {
    key: 39,
    emoji: '🥙',
    name: 'mediterranean',
    keywords: [
      'gyro',
      'hummus',
      'pita',
      'olives',
      'feta',
      'falafel',
      'kebab',
      'persian',
    ],
    primaryType: [
      'mediterranean_restaurant',
      'greek_restaurant',
      'lebanese_restaurant',
      'turkish_restaurant',
    ],
  },
  {
    key: 40,
    emoji: '🍚',
    name: 'asian_rice',
    keywords: ['rice', 'stir-fry', 'curry', 'sushi', 'bowl'],
    primaryType: ['indonesian_restaurant', 'chinese_restaurant'],
  },
  {
    key: 41,
    emoji: '🥤',
    name: 'juice',
    keywords: [
      'smoothie',
      'fruit',
      'healthy',
      'drink',
      'refresh',
      'tea',
      'tea house',
    ],
    primaryType: ['juice_shop', 'tea_house'],
  },
  {
    key: 42,
    emoji: '🚚',
    name: 'delivery',
    keywords: ['takeout', 'food', 'service', 'fast', 'home'],
    primaryType: ['meal_delivery'],
  },
  {
    key: 43,
    emoji: '🥡',
    name: 'takeaway',
    keywords: ['to-go', 'food', 'quick', 'pickup', 'box'],
    primaryType: ['meal_takeaway'],
  },
  {
    key: 44,
    emoji: '🍵',
    name: 'tea',
    keywords: ['herbal', 'green', 'black', 'chai', 'relax'],
    primaryType: ['tea_house'],
  },
  {
    key: 45,
    emoji: '🥕',
    name: 'vegetarian',
    keywords: ['veggie', 'healthy', 'greens', 'plant-based', 'salad'],
    primaryType: ['vegetarian_restaurant'],
  },
];

export const CATEGORY_MAP_LOOKUP: Record<
  number,
  (typeof CATEGORY_MAP)[number]
> = CATEGORY_MAP.reduce(
  (acc, c) => ({
    ...acc,
    [c.key]: c,
  }),
  {}
);

export const EMOJI_OVERRIDES: Record<string, string> = {
  // Pizza places (key: 1, emoji: 🍕)
  'pizza hut': '🍕',
  "domino's": '🍕',
  "papa john's": '🍕',
  'little caesars': '🍕',
  'pizza express': '🍕',

  // Burger places (key: 5, emoji: 🍔)
  "mcdonald's": '🍔',
  'burger king': '🍔',
  'five guys': '🍔',
  'in-n-out': '🍔',
  'shake shack': '🍔',
  "wendy's": '🍔',
  "carl's jr": '🍔',
  'jack in the box': '🍔',

  // Mexican places (key: 6, emoji: 🌮)
  'taco bell': '🌯',
  'taco loco': '🌮',
  'taco taco': '🌮',
  'taco time': '🌮',
  priomos: '🌮',
  'burrito factory': '🌯',
  'the taco stand': '🌮',
  qdoba: '🌯',
  'chipotle mexican grill': '🌯',

  // Chicken places (key: 15, emoji: 🍗)
  kfc: '🍗',
  popeyes: '🍗',
  'chick-fil-a': '🍗',
  "dave's hot chicken": '🍗',
  "raising cane's": '🍗',
  "church's chicken": '🍗',
  wingstop: '🍗',
  'buffalo wild wings': '🍗',

  // Bakery places (key: 22, emoji: 🥐)
  bakery: '🥐',
  'pastry shop': '🥐',
  croissant: '🥐',
  cake: '🥐',
  muffin: '🥐',

  // BBQ places (key: 27, emoji: 🍖)
  "dick's barbecue": '🍖',
  'smokin joes': '🍖',
  'bbq king': '🍖',
  'bbq joint': '🍖',
  'bbq pit': '🍖',
  'bbq shack': '🍖',
  'bbq grill': '🍖',
  'bbq smokehouse': '🍖',

  // Bagel places (key: 28, emoji: 🥯)
  'bagel factory': '🥯',
  'bagel bites': '🥯',
  'bagel boss': '🥯',
  'bagel delight': '🥯',
  'einstein bros': '🥯',

  // Breakfast places (key: 29, emoji: 🥞)
  ihop: '🥞',
  snooze: '🥞',
  "denny's": '🥞',
  'waffle house': '🥞',

  // Confectionery places (key: 34, emoji: 🍭)
  candyland: '🍭',
  'sweet treats': '🍭',
  'sugar rush': '🍭',
  'chocolate heaven': '🍭',
  crumbl: '🍭',

  // Donut places (key: 36, emoji: 🍩)
  dunkin: '🍩',
  'krispy kreme': '🍩',
  'tim hortons': '🍩',
  'dairy queen': '🍩',

  // Fast food places (key: 37, emoji: 🍟)
  "arby's": '🍟',
  subway: '🍟',
  'white castle': '🍟',
  'del taco': '🍟',

  // Fine dining places (key: 38, emoji: 🍴)
  'the french laundry': '🍴',
  alinea: '🍴',
  'le bernardin': '🍴',
  narisawa: '🍴',
  'osteria francescana': '🍴',

  // Mediterranean places (key: 39, emoji: 🥙)
  'gyro king': '🥙',
  'hummus house': '🥙',
  'pita palace': '🥙',
  'feta factory': '🥙',
  'falafel king': '🥙',
  cava: '🥙',
  'halal bros': '🥙',
  'kabab & grill': '🥙',
  "zaxby's": '🥙',
  'pita pit': '🥙',
  'pita jungle': '🥙',
  'pita mediterranean': '🥙',

  // Asian rice places (key: 40, emoji: 🍚)
  'panda express': '🍚',

  // Juice places (key: 41, emoji: 🥤)
  'jamba juice': '🥤',
  'smoothie king': '🥤',
  'tapioca express': '🥤',
};
