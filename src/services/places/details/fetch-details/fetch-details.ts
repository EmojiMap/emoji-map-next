import { env } from '@/env';
import { log } from '@/utils/log';
import { transformDetailsData } from '../data-transformer/data-transformer';
import { googleDetailsResponseSchema } from '../validator/details-validator';

/**
 * Fetches place details from the Google Places API for a given place ID
 *
 * @param id - The Google Places ID of the location to fetch details for
 * @returns The place details result from the Google Places API
 * @throws {Error} If the API request fails or no result is found
 *
 * @example
 * ```ts
 * const placeDetails = await fetchDetails('ChIJN1t_tDeuEmsRUsoyG83frY4');
 * ```
 */
export async function fetchDetails(id: string) {
  try {
    // Build the Details URL
    const apiKey = env.GOOGLE_PLACES_API_KEY;
    const baseUrl = env.GOOGLE_PLACES_URL;

    const fields = [
      'name',
      'rating',
      'reviews',
      'priceLevel',
      'userRatingCount',
      'currentOpeningHours.openNow',
      'primaryTypeDisplayName.text',
      'displayName.text',
      'takeout',
      'delivery',
      'dineIn',
      'editorialSummary.text',
      'outdoorSeating',
      'liveMusic',
      'menuForChildren',
      'servesDessert',
      'servesCoffee',
      'goodForChildren',
      'goodForGroups',
      'allowsDogs',
      'restroom',
      'paymentOptions',
      'generativeSummary.overview.text',
      'location',
      'formattedAddress',
    ];

    const params = new URLSearchParams({
      fields: fields.join(','),
      key: apiKey,
    });

    const fullUrl = `${baseUrl}/places/${id}?${params.toString()}`;

    // Make the request
    const response = await fetch(fullUrl);

    if (!response.ok) {
      log.error(`[API] Error fetching details`, { error: response.statusText });
      throw new Error(`API Error: ${response.statusText}`);
    }

    // Parse the response as JSON (untyped)
    const rawData = await response.json();

    if (!rawData) {
      log.error(`[API] No result found`);
      throw new Error('No result found');
    }

    // Validate the data using Zod schema
    const validationResult = googleDetailsResponseSchema.safeParse(rawData);

    if (!validationResult.success) {
      log.error(
        `[API] Invalid API response format - Zod Validation Error`,
        { error: validationResult.error },
        rawData
      );
      throw new Error('Invalid API response format');
    }

    // Extract the validated data
    const data = transformDetailsData(validationResult.data);

    return data;
  } catch (error) {
    log.error(`[API] Error fetching details`, { error });
    throw error;
  }
}
