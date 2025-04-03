import { ReviewStatus } from '@prisma/client';
import { describe, it, expect } from 'vitest';
import { transformDetailsData } from './data-transformer';
import { getReviewId } from '../get-review-id/get-review-id';
import type { ValidatedGoogleDetailsResponse } from '../validator/details-validator';

describe('data-transformer', () => {
  describe('transformDetailsData', () => {
    it('should transform a complete response correctly', () => {
      // Arrange
      const mockData = {
        id: 'ChIJifIePKtZwokRVZ-UdRGkZzs',
        name: 'places/ChIJifIePKtZwokRVZ-UdRGkZzs',
        displayName: {
          text: "Joe's Pizza Broadway",
        },
        primaryTypeDisplayName: {
          text: 'Pizza Restaurant',
        },
        delivery: true,
        dineIn: true,
        goodForChildren: true,
        restroom: false,
        goodForGroups: true,
        paymentOptions: {
          acceptsCreditCards: true,
          acceptsDebitCards: true,
          acceptsCashOnly: false,
        },
        reviews: [
          {
            name: 'places/ChIJifIePKtZwokRVZ-UdRGkZzs/reviews/ChdDSUhNMG9nS0VJQ0FnTUR3eGREQzV3RRAB',
            relativePublishTimeDescription: 'in the last week',
            rating: 5,
            text: {
              text: "Came to Joe's Pizza in Times Square after hearing all the hype—and it absolutely lived up to it. The place was packed (as expected), but the line moved fast and the staff kept things flowing smoothly.\n\nI got a pepperoni slice with sausage, mushrooms, and red onions—super flavorful, thin crust, crispy on the edges, and not overly greasy. It had that perfect NYC street slice taste you hope for. Just classic and satisfying.\n\nThe vibe inside is pure New York: walls covered in celebrity photos, press clippings, and Spider-Man references. It feels like a piece of pizza history. Despite being in such a tourist-heavy area, Joe's still feels authentic and delivers the real deal.\n\nIf you're in NYC and want a proper slice, this is the spot. I'd definitely come back.",
              languageCode: 'en',
            },
            originalText: {
              text: "Came to Joe's Pizza in Times Square after hearing all the hype—and it absolutely lived up to it. The place was packed (as expected), but the line moved fast and the staff kept things flowing smoothly.\n\nI got a pepperoni slice with sausage, mushrooms, and red onions—super flavorful, thin crust, crispy on the edges, and not overly greasy. It had that perfect NYC street slice taste you hope for. Just classic and satisfying.\n\nThe vibe inside is pure New York: walls covered in celebrity photos, press clippings, and Spider-Man references. It feels like a piece of pizza history. Despite being in such a tourist-heavy area, Joe's still feels authentic and delivers the real deal.\n\nIf you're in NYC and want a proper slice, this is the spot. I'd definitely come back.",
              languageCode: 'en',
            },
          },
        ],
        rating: 4.5,
        priceLevel: 'PRICE_LEVEL_INEXPENSIVE',
        userRatingCount: 21260,
        currentOpeningHours: {
          openNow: true,
        },
        takeout: true,
        editorialSummary: {
          text: 'Modern outpost of a longtime counter-serve pizza joint prepping New York-style slices and pies.',
        },
        outdoorSeating: true,
        liveMusic: false,
        menuForChildren: false,
        servesDessert: false,
        servesCoffee: false,
        generativeSummary: {
          overview: {
            text: 'Casual spot offering many types of New York-style pizza, including by the slice, until late at night.',
          },
        },
        location: {
          latitude: 40.754679499999995,
          longitude: -73.9870291,
        },
        formattedAddress: '1435 Broadway, New York, NY 10018, USA',
      };

      // Act
      const result = transformDetailsData(
        mockData as ValidatedGoogleDetailsResponse
      );

      // Assert
      expect(result).toEqual({
        id: mockData.id,
        name: mockData.displayName.text,
        reviews: [
          {
            id: getReviewId(mockData.reviews[0].name),
            placeId: mockData.id,
            rating: mockData.reviews[0].rating,
            relativePublishTimeDescription:
              mockData.reviews[0].relativePublishTimeDescription,
            status: ReviewStatus.DEFAULT,
            text: mockData.reviews[0].text.text,
          },
        ],
        rating: mockData.rating,
        priceLevel: 1, // PRICE_LEVEL_INEXPENSIVE maps to 1
        userRatingCount: mockData.userRatingCount,
        openNow: mockData.currentOpeningHours.openNow,
        displayName: mockData.displayName.text,
        primaryTypeDisplayName: mockData.primaryTypeDisplayName.text,
        takeout: mockData.takeout,
        delivery: mockData.delivery,
        dineIn: mockData.dineIn,
        editorialSummary: mockData.editorialSummary.text,
        outdoorSeating: mockData.outdoorSeating,
        liveMusic: mockData.liveMusic,
        menuForChildren: mockData.menuForChildren,
        servesDessert: mockData.servesDessert,
        servesCoffee: mockData.servesCoffee,
        goodForChildren: mockData.goodForChildren,
        goodForGroups: mockData.goodForGroups,
        allowsDogs: false,
        restroom: mockData.restroom,
        acceptsCreditCards: mockData.paymentOptions.acceptsCreditCards,
        acceptsDebitCards: mockData.paymentOptions.acceptsDebitCards,
        acceptsCashOnly: mockData.paymentOptions.acceptsCashOnly,
        paymentOptions: {
          acceptsCreditCards: mockData.paymentOptions.acceptsCreditCards,
          acceptsDebitCards: mockData.paymentOptions.acceptsDebitCards,
          acceptsCashOnly: mockData.paymentOptions.acceptsCashOnly,
        },
        generativeSummary: mockData.generativeSummary.overview.text,
        isFree: false,
        location: {
          latitude: mockData.location.latitude,
          longitude: mockData.location.longitude,
        },
        address: mockData.formattedAddress,
        merchantId: null,
        googleRating: mockData.rating,
        latitude: mockData.location.latitude,
        longitude: mockData.location.longitude,
      });
    });

    it('should handle a free place correctly', () => {
      // Arrange
      const mockData: ValidatedGoogleDetailsResponse = {
        id: 'free-museum-123',
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
        id: 'unknown-price-123',
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
        id: 'minimal-place-123',
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
        id: 'minimal-place-123',
        name: '',
        reviews: [],
        displayName: '',
        primaryTypeDisplayName: '',
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
        paymentOptions: {
          acceptsCreditCards: false,
          acceptsDebitCards: false,
          acceptsCashOnly: false,
        },
        generativeSummary: '',
        isFree: false,
        location: {
          latitude: 37.7749,
          longitude: -122.4194,
        },
        latitude: 37.7749,
        longitude: -122.4194,
        address: '123 Minimal St, San Francisco, CA 94105',
        merchantId: null,
        googleRating: 3.5,
        rating: 3.5,
        userRatingCount: 10,
        openNow: null,
        priceLevel: null,
      });
    });

    it('should handle missing nested fields correctly', () => {
      // Arrange
      const mockData: ValidatedGoogleDetailsResponse = {
        id: 'partial-data-123',
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
      expect(result.displayName).toBe('');
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
          id: `${input.toLowerCase()}-place-123`,
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
  });
});
