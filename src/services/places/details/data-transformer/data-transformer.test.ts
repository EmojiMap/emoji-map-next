import { describe, it, expect } from 'vitest';
import { transformDetailsData } from './data-transformer';
import type { ValidatedGoogleDetailsResponse } from '../validator/details-validator';

describe('data-transformer', () => {
  describe('transformDetailsData', () => {
    it('should transform a complete response correctly', () => {
      // Arrange
      const mockData: ValidatedGoogleDetailsResponse = {
        id: 'test_place_123',
        name: 'Test Restaurant',
        reviews: [
          {
            name: 'places/test_place_123/reviews/review_1',
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
        ],
        rating: 4.5,
        priceLevel: 'PRICE_LEVEL_MODERATE',
        userRatingCount: 100,
        currentOpeningHours: {
          openNow: true,
        },
        displayName: {
          text: 'Test Restaurant Display Name',
        },
        primaryTypeDisplayName: {
          text: 'Restaurant',
        },
        takeout: true,
        delivery: false,
        dineIn: true,
        editorialSummary: {
          text: 'A great restaurant with amazing food',
        },
        outdoorSeating: true,
        liveMusic: false,
        menuForChildren: true,
        servesDessert: true,
        servesCoffee: true,
        goodForChildren: true,
        goodForGroups: true,
        allowsDogs: false,
        restroom: true,
        paymentOptions: {
          acceptsCreditCards: true,
          acceptsDebitCards: true,
          acceptsCashOnly: false,
        },
        generativeSummary: {
          overview: {
            text: 'This is a generative summary of the restaurant',
          },
        },
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        formattedAddress: '123 Test St, San Francisco, CA 94105',
      };

      // Act
      const result = transformDetailsData(mockData);

      // Assert
      expect(result).toEqual({
        id: 'test_place_123',
        name: 'Test Restaurant Display Name',
        displayName: 'Test Restaurant Display Name',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        rating: 4.5,
        reviews: expect.arrayContaining([
          expect.objectContaining({
            id: 'review_1',
            status: 'DEFAULT',
            rating: 5,
            relativePublishTimeDescription: '2 days ago',
            text: 'Great place!',
          }),
        ]),
        googleRating: 4.5,
        priceLevel: 2, // PRICE_LEVEL_MODERATE maps to 2
        userRatingCount: 100,
        openNow: true,
        primaryTypeDisplayName: 'Restaurant',
        takeout: true,
        delivery: false,
        dineIn: true,
        editorialSummary: 'A great restaurant with amazing food',
        outdoorSeating: true,
        liveMusic: false,
        menuForChildren: true,
        servesDessert: true,
        servesCoffee: true,
        goodForChildren: true,
        goodForGroups: true,
        allowsDogs: false,
        restroom: true,
        acceptsCashOnly: false,
        acceptsCreditCards: true,
        acceptsDebitCards: true,
        generativeSummary: 'This is a generative summary of the restaurant',
        isFree: false,
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Test St, San Francisco, CA 94105',
        merchantId: null,
      });
    });

    it('should handle a free place correctly', () => {
      // Arrange
      const mockData: ValidatedGoogleDetailsResponse = {
        id: 'free_place_123',
        name: 'Free Museum',
        priceLevel: 'PRICE_LEVEL_FREE',
        rating: 4.8,
        userRatingCount: 50,
        reviews: [],
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        formattedAddress: '123 Museum St, San Francisco, CA 94105',
      };

      // Act
      const result = transformDetailsData(mockData);

      // Assert
      expect(result.priceLevel).toBe(1); // PRICE_LEVEL_FREE maps to 1
      expect(result.isFree).toBe(true);
    });

    it('should handle a place with unspecified price level', () => {
      // Arrange
      const mockData: ValidatedGoogleDetailsResponse = {
        id: 'unspecified_price_123',
        name: 'Unknown Price Place',
        priceLevel: 'PRICE_LEVEL_UNSPECIFIED',
        rating: 4.0,
        userRatingCount: 30,
        reviews: [],
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        formattedAddress: '123 Unknown St, San Francisco, CA 94105',
      };

      // Act
      const result = transformDetailsData(mockData);

      // Assert
      expect(result.priceLevel).toBeNull();
      expect(result.isFree).toBe(false);
    });

    it('should handle missing optional fields with default values', () => {
      // Arrange
      const mockData: ValidatedGoogleDetailsResponse = {
        id: 'minimal_place_123',
        name: 'Minimal Place',
        rating: 3.5,
        userRatingCount: 10,
        reviews: [],
        priceLevel: 'PRICE_LEVEL_UNSPECIFIED',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        formattedAddress: '123 Minimal St, San Francisco, CA 94105',
      };

      // Act
      const result = transformDetailsData(mockData);

      // Assert
      expect(result).toMatchObject({
        id: 'minimal_place_123',
        name: '',
        displayName: '',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        rating: 3.5,
        reviews: [],
        takeout: false,
        delivery: false,
        dineIn: false,
        editorialSummary: '',
        outdoorSeating: false,
        liveMusic: false,
        menuForChildren: false,
        servesDessert: false,
        servesCoffee: false,
        goodForChildren: false,
        goodForGroups: false,
        allowsDogs: false,
        restroom: false,
        acceptsCashOnly: false,
        acceptsCreditCards: false,
        acceptsDebitCards: false,
        generativeSummary: '',
        isFree: false,
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Minimal St, San Francisco, CA 94105',
        merchantId: null,
      });
    });

    it('should handle missing nested fields correctly', () => {
      // Arrange
      const mockData: ValidatedGoogleDetailsResponse = {
        id: 'partial_place_123',
        name: 'Partial Data Place',
        reviews: [],
        rating: 3.5,
        userRatingCount: 15,
        priceLevel: 'PRICE_LEVEL_UNSPECIFIED',
        displayName: {}, // Empty object without text field
        primaryTypeDisplayName: {}, // Empty object without text field
        editorialSummary: {}, // Empty object without text field
        generativeSummary: {
          // Missing overview field
        },
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        formattedAddress: '123 Partial St, San Francisco, CA 94105',
      };

      // Act
      const result = transformDetailsData(mockData);

      // Assert
      expect(result.name).toBe('');
      expect(result.primaryTypeDisplayName).toBe('');
      expect(result.editorialSummary).toBe('');
      expect(result.generativeSummary).toBe('');
    });

    it('should handle all price level mappings correctly', () => {
      // Test all price level mappings
      const priceLevels = [
        { input: 'PRICE_LEVEL_FREE', expected: 1, isFree: true },
        { input: 'PRICE_LEVEL_INEXPENSIVE', expected: 1, isFree: false },
        { input: 'PRICE_LEVEL_MODERATE', expected: 2, isFree: false },
        { input: 'PRICE_LEVEL_EXPENSIVE', expected: 3, isFree: false },
        { input: 'PRICE_LEVEL_VERY_EXPENSIVE', expected: 4, isFree: false },
        { input: 'PRICE_LEVEL_UNSPECIFIED', expected: null, isFree: false },
      ] as const;

      priceLevels.forEach(({ input, expected, isFree }) => {
        // Arrange
        const mockData: ValidatedGoogleDetailsResponse = {
          id: `price_level_${input}`,
          name: `${input} Place`,
          priceLevel: input,
          rating: 4.0,
          userRatingCount: 20,
          reviews: [],
          location: {
            latitude: 37.7749,
            longitude: -122.4194,
          },
          formattedAddress: `123 ${input} St, San Francisco, CA 94105`,
        };

        // Act
        const result = transformDetailsData(mockData);

        // Assert
        expect(result.priceLevel).toBe(expected);
        expect(result.isFree).toBe(isFree);
      });
    });

    it('should transform reviews with correct status and unique ids', () => {
      // Arrange
      const mockData: ValidatedGoogleDetailsResponse = {
        id: 'review_test_place_123',
        name: 'Review Test Place',
        reviews: [
          {
            name: 'places/review_test_place_123/reviews/review_1',
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
            name: 'places/review_test_place_123/reviews/review_2',
            rating: 4,
            relativePublishTimeDescription: '1 week ago',
            text: {
              text: 'Good experience',
              languageCode: 'en',
            },
            originalText: {
              text: 'Good experience',
              languageCode: 'en',
            },
          },
        ],
        rating: 4.5,
        userRatingCount: 2,
        priceLevel: 'PRICE_LEVEL_MODERATE',
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        formattedAddress: '123 Review St, San Francisco, CA 94105',
      };

      // Act
      const result = transformDetailsData(mockData);

      // Assert
      expect(result.reviews).toHaveLength(2);
      result.reviews.forEach((review, index) => {
        expect(review).toMatchObject({
          rating: mockData.reviews[index].rating,
          relativePublishTimeDescription:
            mockData.reviews[index].relativePublishTimeDescription,
          text:
            mockData.reviews[index].text?.text ??
            mockData.reviews[index].originalText?.text ??
            '',
          status: 'DEFAULT',
        });
        expect(review.id).toBe(`review_${index + 1}`);
      });

      // Verify IDs are unique
      const ids = result.reviews.map((review) => review.id);
      expect(new Set(ids).size).toBe(ids.length);
    });
  });
});
