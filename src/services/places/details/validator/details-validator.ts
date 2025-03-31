import { z } from 'zod';

// Define Zod schema for the Google Details API response
const reviewSchema = z.object({
  name: z.string(), // maps to place name
  relativePublishTimeDescription: z.string(),
  rating: z.number(),
  text: z
    .object({
      text: z.string().optional(),
      languageCode: z.string().optional(),
    })
    .optional(),
  originalText: z
    .object({
      text: z.string().optional(),
      languageCode: z.string().optional(),
    })
    .optional(),
});

const textObjectSchema = z.object({
  text: z.string().optional(),
});

// Define the valid price level values
const priceLevelEnum = z.enum([
  'PRICE_LEVEL_UNSPECIFIED',
  'PRICE_LEVEL_FREE',
  'PRICE_LEVEL_INEXPENSIVE',
  'PRICE_LEVEL_MODERATE',
  'PRICE_LEVEL_EXPENSIVE',
  'PRICE_LEVEL_VERY_EXPENSIVE',
]);

export const googleDetailsResponseSchema = z.object({
  name: z.string().optional(),
  displayName: textObjectSchema.optional(),
  primaryTypeDisplayName: textObjectSchema.optional(),
  delivery: z.boolean().optional(),
  dineIn: z.boolean().optional(),
  goodForChildren: z.boolean().optional(),
  restroom: z.boolean().optional(),
  goodForGroups: z.boolean().optional(),
  paymentOptions: z
    .object({
      acceptsCreditCards: z.boolean().optional().default(false),
      acceptsDebitCards: z.boolean().optional().default(false),
      acceptsCashOnly: z.boolean().optional().default(false),
    })
    .optional(),
  reviews: z
    .array(reviewSchema)
    .optional()
    .default([])
    .transform((reviews) => {
      // Filter out reviews that don't have both text.text and originalText.text
      return reviews.filter(
        (review) =>
          review?.text?.text !== undefined &&
          review?.text?.text !== '' &&
          review?.originalText?.text !== undefined &&
          review?.originalText?.text !== ''
      );
    }),
  rating: z.number().optional(),
  priceLevel: priceLevelEnum.optional().default('PRICE_LEVEL_UNSPECIFIED'),
  userRatingCount: z.number().optional(),
  currentOpeningHours: z
    .object({
      openNow: z.boolean(),
    })
    .optional(),
  takeout: z.boolean().optional(),
  editorialSummary: textObjectSchema.optional(),
  outdoorSeating: z.boolean().optional(),
  liveMusic: z.boolean().optional(),
  menuForChildren: z.boolean().optional(),
  servesDessert: z.boolean().optional(),
  servesCoffee: z.boolean().optional(),
  allowsDogs: z.boolean().optional(),
  generativeSummary: z
    .object({
      overview: textObjectSchema.optional(),
    })
    .optional(),
  location: z.object({
    latitude: z.number(),
    longitude: z.number(),
  }),
  formattedAddress: z.string().optional(),
});

// Define the type for the validated data
export type ValidatedGoogleDetailsResponse = z.infer<
  typeof googleDetailsResponseSchema
>;

/**
 * Maps Google Places API price level to Detail price level
 * @param priceLevel - The Google Places API price level
 * @returns The Detail price level (1-4 or null)
 */
export function mapPriceLevel(priceLevel: string): (1 | 2 | 3 | 4) | null {
  switch (priceLevel) {
    case 'PRICE_LEVEL_FREE':
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4;
    case 'PRICE_LEVEL_UNSPECIFIED':
    default:
      return null;
  }
}
export const DEFAULT_PRICE_LEVEL = 'PRICE_LEVEL_UNSPECIFIED';

export const PRICE_LEVEL_MAP: Record<string, number> = {
  PRICE_LEVEL_UNSPECIFIED: 1,
  PRICE_LEVEL_FREE: 1,
  PRICE_LEVEL_INEXPENSIVE: 1,
  PRICE_LEVEL_MODERATE: 2,
  PRICE_LEVEL_EXPENSIVE: 3,
  PRICE_LEVEL_VERY_EXPENSIVE: 4,
};
