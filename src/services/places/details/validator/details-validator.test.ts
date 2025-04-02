import { describe, it, expect } from 'vitest';
import {
  googleDetailsResponseSchema,
  mapPriceLevel,
} from './details-validator';

describe('details-validator', () => {
  // Default location data for tests
  const defaultLocation = {
    location: {
      latitude: 37.7749,
      longitude: -122.4194,
    },
    formattedAddress: '123 Test St, San Francisco, CA 94105',
  };

  describe('mapPriceLevel', () => {
    it('should map PRICE_LEVEL_FREE to 1', () => {
      expect(mapPriceLevel('PRICE_LEVEL_FREE')).toBe(1);
    });

    it('should map PRICE_LEVEL_INEXPENSIVE to 1', () => {
      expect(mapPriceLevel('PRICE_LEVEL_INEXPENSIVE')).toBe(1);
    });

    it('should map PRICE_LEVEL_MODERATE to 2', () => {
      expect(mapPriceLevel('PRICE_LEVEL_MODERATE')).toBe(2);
    });

    it('should map PRICE_LEVEL_EXPENSIVE to 3', () => {
      expect(mapPriceLevel('PRICE_LEVEL_EXPENSIVE')).toBe(3);
    });

    it('should map PRICE_LEVEL_VERY_EXPENSIVE to 4', () => {
      expect(mapPriceLevel('PRICE_LEVEL_VERY_EXPENSIVE')).toBe(4);
    });

    it('should map PRICE_LEVEL_UNSPECIFIED to null', () => {
      expect(mapPriceLevel('PRICE_LEVEL_UNSPECIFIED')).toBeNull();
    });

    it('should map unknown values to null', () => {
      expect(mapPriceLevel('UNKNOWN_VALUE')).toBeNull();
    });
  });

  describe('googleDetailsResponseSchema', () => {
    it('should validate a valid response', () => {
      const validResponse = {
        id: 'test_place_123',
        name: 'Test Place',
        priceLevel: 'PRICE_LEVEL_MODERATE',
        rating: 4.5,
        userRatingCount: 100,
        ...defaultLocation,
      };

      const result = googleDetailsResponseSchema.safeParse(validResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('test_place_123');
        expect(result.data.name).toBe('Test Place');
        expect(result.data.priceLevel).toBe('PRICE_LEVEL_MODERATE');
        expect(result.data.rating).toBe(4.5);
        expect(result.data.userRatingCount).toBe(100);
        expect(result.data.location).toEqual(defaultLocation.location);
        expect(result.data.formattedAddress).toBe(
          defaultLocation.formattedAddress
        );
      }
    });

    it('should apply default values for optional fields', () => {
      const minimalResponse = {
        id: 'minimal_place_123',
        name: 'Test Place',
        rating: 4.0,
        userRatingCount: 50,
        ...defaultLocation,
      };

      const result = googleDetailsResponseSchema.safeParse(minimalResponse);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.id).toBe('minimal_place_123');
        expect(result.data.name).toBe('Test Place');
        expect(result.data.priceLevel).toBe('PRICE_LEVEL_UNSPECIFIED');
        expect(result.data.reviews).toEqual([]);
      }
    });

    it('should accept responses without a name', () => {
      const responseWithoutName = {
        id: 'no_name_place_123',
        priceLevel: 'PRICE_LEVEL_MODERATE',
        rating: 4.5,
        userRatingCount: 100,
        ...defaultLocation,
      };

      const result = googleDetailsResponseSchema.safeParse(responseWithoutName);
      expect(result.success).toBe(true);
    });

    it('should accept responses without a rating', () => {
      const responseWithoutRating = {
        id: 'no_rating_place_123',
        name: 'Test Place',
        priceLevel: 'PRICE_LEVEL_MODERATE',
        userRatingCount: 100,
        ...defaultLocation,
      };

      const result = googleDetailsResponseSchema.safeParse(
        responseWithoutRating
      );
      expect(result.success).toBe(true);
    });

    it('should accept responses without a userRatingCount', () => {
      const responseWithoutUserRatingCount = {
        id: 'no_rating_count_place_123',
        name: 'Test Place',
        priceLevel: 'PRICE_LEVEL_MODERATE',
        rating: 4.5,
        ...defaultLocation,
      };

      const result = googleDetailsResponseSchema.safeParse(
        responseWithoutUserRatingCount
      );
      expect(result.success).toBe(true);
    });

    it('should validate a response with reviews', () => {
      const responseWithReviews = {
        id: 'reviews_place_123',
        name: 'Test Place',
        rating: 4.5,
        userRatingCount: 100,
        ...defaultLocation,
        reviews: [
          {
            name: 'Valid Review',
            rating: 5,
            relativePublishTimeDescription: '2 days ago',
            text: {
              text: 'Great place!',
              languageCode: 'en',
            },
            originalText: {
              text: 'Great place!',
              languageCode: 'en',
            },
          },
          {
            name: 'Missing Text',
            rating: 4,
            relativePublishTimeDescription: '3 days ago',
            text: {
              languageCode: 'en',
            },
            originalText: {
              text: 'Good service',
              languageCode: 'en',
            },
          },
          {
            name: 'Missing Original Text',
            rating: 3,
            relativePublishTimeDescription: '4 days ago',
            text: {
              text: 'Nice atmosphere',
              languageCode: 'en',
            },
            originalText: {
              languageCode: 'en',
            },
          },
          {
            name: 'Empty Text',
            rating: 2,
            relativePublishTimeDescription: '5 days ago',
            text: {
              text: '',
              languageCode: 'en',
            },
            originalText: {
              text: 'Not good',
              languageCode: 'en',
            },
          },
          {
            name: 'Empty Original Text',
            rating: 1,
            relativePublishTimeDescription: '6 days ago',
            text: {
              text: 'Terrible',
              languageCode: 'en',
            },
            originalText: {
              text: '',
              languageCode: 'en',
            },
          },
          {
            name: 'Missing Text Object',
            rating: 3,
            relativePublishTimeDescription: '7 days ago',
            originalText: {
              text: 'Average',
              languageCode: 'en',
            },
          },
          {
            name: 'Missing Original Text Object',
            rating: 3,
            relativePublishTimeDescription: '8 days ago',
            text: {
              text: 'Average',
              languageCode: 'en',
            },
          },
        ],
      };

      const result = googleDetailsResponseSchema.safeParse(responseWithReviews);
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.reviews).toHaveLength(1);
        expect(result.data.reviews[0].rating).toBe(5);
        expect(result.data.reviews[0].text).toEqual({
          text: 'Great place!',
          languageCode: 'en',
        });
      }
    });

    it('should validate a response with payment options', () => {
      const responseWithPaymentOptions = {
        id: 'payment_options_place_123',
        name: 'Test Place',
        rating: 4.5,
        userRatingCount: 100,
        ...defaultLocation,
        paymentOptions: {
          acceptsCreditCards: true,
          acceptsDebitCards: false,
          acceptsCashOnly: false,
        },
      };

      const result = googleDetailsResponseSchema.safeParse(
        responseWithPaymentOptions
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.paymentOptions?.acceptsCreditCards).toBe(true);
        expect(result.data.paymentOptions?.acceptsDebitCards).toBe(false);
        expect(result.data.paymentOptions?.acceptsCashOnly).toBe(false);
      }
    });

    it('should validate a response with PRICE_LEVEL_FREE', () => {
      const responseWithFreePrice = {
        id: 'free_place_123',
        name: 'Free Museum',
        rating: 4.8,
        userRatingCount: 200,
        priceLevel: 'PRICE_LEVEL_FREE',
        ...defaultLocation,
      };

      const result = googleDetailsResponseSchema.safeParse(
        responseWithFreePrice
      );
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.priceLevel).toBe('PRICE_LEVEL_FREE');
      }
    });

    it('should reject invalid price level values', () => {
      const invalidPriceLevel = {
        id: 'invalid_price_place_123',
        name: 'Test Place',
        rating: 4.5,
        userRatingCount: 100,
        priceLevel: 'INVALID_PRICE_LEVEL',
        ...defaultLocation,
      };

      const result = googleDetailsResponseSchema.safeParse(invalidPriceLevel);
      expect(result.success).toBe(false);
    });

    it('should validate all valid price level values', () => {
      // Test all valid price levels
      const priceLevels = [
        'PRICE_LEVEL_FREE',
        'PRICE_LEVEL_INEXPENSIVE',
        'PRICE_LEVEL_MODERATE',
        'PRICE_LEVEL_EXPENSIVE',
        'PRICE_LEVEL_VERY_EXPENSIVE',
        'PRICE_LEVEL_UNSPECIFIED',
      ];

      priceLevels.forEach((priceLevel) => {
        const response = {
          id: `price_level_${priceLevel}`,
          name: `${priceLevel} Place`,
          rating: 4.0,
          userRatingCount: 50,
          priceLevel,
          ...defaultLocation,
        };

        const result = googleDetailsResponseSchema.safeParse(response);
        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data.priceLevel).toBe(priceLevel);
        }
      });
    });

    it('should filter out reviews without text.text or originalText.text', () => {
      const responseWithMixedReviews = {
        id: 'mixed_reviews_place_123',
        name: 'Test Place',
        rating: 4.5,
        userRatingCount: 100,
        ...defaultLocation,
        reviews: [
          // Valid review with both text.text and originalText.text
          {
            name: 'Valid Review',
            rating: 5,
            relativePublishTimeDescription: '2 days ago',
            text: {
              text: 'Great place!',
              languageCode: 'en',
            },
            originalText: {
              text: 'Great place!',
              languageCode: 'en',
            },
          },
          // Missing text.text
          {
            name: 'Missing Text',
            rating: 4,
            relativePublishTimeDescription: '3 days ago',
            text: {
              languageCode: 'en',
            },
            originalText: {
              text: 'Good service',
              languageCode: 'en',
            },
          },
          // Missing originalText.text
          {
            name: 'Missing Original Text',
            rating: 3,
            relativePublishTimeDescription: '4 days ago',
            text: {
              text: 'Nice atmosphere',
              languageCode: 'en',
            },
            originalText: {
              languageCode: 'en',
            },
          },
          // Empty text.text
          {
            name: 'Empty Text',
            rating: 2,
            relativePublishTimeDescription: '5 days ago',
            text: {
              text: '',
              languageCode: 'en',
            },
            originalText: {
              text: 'Not good',
              languageCode: 'en',
            },
          },
          // Empty originalText.text
          {
            name: 'Empty Original Text',
            rating: 1,
            relativePublishTimeDescription: '6 days ago',
            text: {
              text: 'Terrible',
              languageCode: 'en',
            },
            originalText: {
              text: '',
              languageCode: 'en',
            },
          },
          // Missing text object
          {
            name: 'Missing Text Object',
            rating: 3,
            relativePublishTimeDescription: '7 days ago',
            originalText: {
              text: 'Average',
              languageCode: 'en',
            },
          },
          // Missing originalText object
          {
            name: 'Missing Original Text Object',
            rating: 3,
            relativePublishTimeDescription: '8 days ago',
            text: {
              text: 'Average',
              languageCode: 'en',
            },
          },
        ],
      };

      const result = googleDetailsResponseSchema.safeParse(
        responseWithMixedReviews
      );
      expect(result.success).toBe(true);
      if (result.success) {
        // Only the first review should remain after filtering
        expect(result.data.reviews).toHaveLength(1);
        expect(result.data.reviews[0].name).toBe('Valid Review');
        expect(result.data.reviews[0].text?.text).toBe('Great place!');
        expect(result.data.reviews[0].originalText?.text).toBe('Great place!');
      }
    });

    it('should reject responses without an id', () => {
      const responseWithoutId = {
        name: 'Test Place',
        rating: 4.5,
        userRatingCount: 100,
        ...defaultLocation,
      };

      const result = googleDetailsResponseSchema.safeParse(responseWithoutId);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].path[0]).toBe('id');
        expect(result.error.issues[0].message).toBe('Required');
      }
    });
  });
});
