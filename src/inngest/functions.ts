import { prisma } from '@/lib/db';
import { getPlaceDetailsWithCache } from '@/services/places/details/get-place-details-with-cache/get-place-details-with-cache';
import { inngest } from './client';

// Creates place in DB
export const createPlace = inngest.createFunction(
  { id: 'places/create' },
  { event: 'places/create' },
  async ({ event }) => {
    const { id, details } = event.data;

    let place = await prisma.place.findUnique({
      where: {
        id,
      },
    });

    if (place) {
      return { message: `Place ${id} already exists` };
    }

    if (!details.data) {
      return { message: `Place ${id} details not found` };
    }

    place = await prisma.place.create({
      data: {
        id: details.data.id,
        name: details.data.displayName,
        latitude: details.data.location.latitude,
        longitude: details.data.location.longitude,
        address: details.data.address,
        merchantId: null,
        allowsDogs: details.data.allowsDogs,
        delivery: details.data.delivery,
        editorialSummary: details.data.editorialSummary,
        generativeSummary: details.data.generativeSummary,
        goodForChildren: details.data.goodForChildren,
        dineIn: details.data.dineIn,
        goodForGroups: details.data.goodForGroups,
        isFree: details.data.isFree,
        liveMusic: details.data.liveMusic,
        menuForChildren: details.data.menuForChildren,
        outdoorSeating: details.data.outdoorSeating,
        acceptsCashOnly: details.data.acceptsCashOnly,
        acceptsCreditCards: details.data.acceptsCreditCards,
        acceptsDebitCards: details.data.acceptsDebitCards,
        priceLevel: details.data.priceLevel,
        primaryTypeDisplayName: details.data.primaryTypeDisplayName,
        googleRating: details.data.rating,
        servesCoffee: details.data.servesCoffee,
        servesDessert: details.data.servesDessert,
        takeout: details.data.takeout,
        restroom: details.data.restroom,
        openNow: details.data.openNow,
        userRatingCount: details.data.userRatingCount,
      },
    });

    if (!place) {
      return { message: `Place ${id} not created` };
    }

    // TODO: create reviews
    if (details.data.reviews) {
      await prisma.review.createMany({
        data: details.data.reviews.map((review) => ({
          ...review,
          placeId: place.id,
        })),
      });
    }

    return { message: `Place ${id} created` };
  }
);

// Gets from Google API &
// calls createPlace function
export const getPlaceDetails = inngest.createFunction(
  { id: 'places/get-details' },
  { event: 'places/get-details' },
  async ({ event }) => {
    const { id } = event.data;

    // Double check if place exists in DB
    const place = await prisma.place.findUnique({
      where: {
        id: id,
      },
    });

    if (place) {
      return { message: `Place ${id} already exists` };
    }

    const details = await getPlaceDetailsWithCache({ id });

    await inngest.send({
      name: 'places/create',
      data: {
        id,
        details,
      },
    });

    return { message: `Place ${id} created` };
  }
);
