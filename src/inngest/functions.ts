import { prisma } from '@/lib/db';
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

    if (details.data.reviews.length > 0) {
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

// Creates a places photos in the database
export const createPlacePhotos = inngest.createFunction(
  { id: 'places/create-photos' },
  { event: 'places/create-photos' },
  async ({ event }) => {
    const { id, photos } = event.data;

    const place = await prisma.place.findUnique({
      where: {
        id,
      },
    });

    if (!place) {
      return { message: `Place ${id} not found` };
    }

    await prisma.photo.createMany({
      data: photos.map((photo) => ({
        url: photo,
        placeId: place.id,
      })),
    });

    return { message: `Place ${id} photos created` };
  }
);
