import { prisma } from '@/lib/db';
import { transformGoogleDetailsToDbPlace } from '@/services/places/details/transformers/google-details-to-db-place';
import { inngest } from './client';

export const createPlaceWithReviews = inngest.createFunction(
  { id: 'places/create-with-reviews' },
  { event: 'places/create-with-reviews' },
  async ({ event }) => {
    const { id, details } = event.data;

    const { place: dbPlace, reviews: dbReviews } =
      transformGoogleDetailsToDbPlace(details);

    await prisma.place.create({
      data: dbPlace,
    });

    if (dbReviews.length > 0) {
      await prisma.review.createMany({
        data: dbReviews.map((review) => ({
          ...review,
          placeId: dbPlace.id,
        })),
      });
    }

    // get updated place details
    const updatedPlace = await prisma.place.findUnique({
      where: { id },
      include: {
        reviews: true,
      },
    });

    return { message: `Place ${id} created`, place: updatedPlace };
  }
);
