'use client';

import { useReducer, useCallback, useState } from 'react';
import Image from 'next/image';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Star,
  Image as ImageIcon,
  MessageSquare,
  Store,
  Heart,
  Clock,
  ShoppingBag,
  Utensils,
  Sun,
  Coffee,
  Cake,
  Users,
  Bike,
  MoreVertical,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useMerchantQuery,
  usePlaceDetailsQuery,
  usePlacePhotosQuery,
} from '@/hooks';
import { ClaimDialog } from './components/claim-dialog';
import { PlaceListDialog } from './components/place-list-dialog';
import { VerifyDialog } from './components/verify-dialog';
import { dashboardReducer, initialState } from './reducer';
import type { Merchant, Place, Photo, Rating, Review } from '@prisma/client';

// Types for API responses
type PlaceWithRelations = Place & {
  photos: Photo[];
  ratings: Rating[];
  reviews: Review[];
};

export type MerchantResponse = {
  merchant:
    | (Merchant & {
        places: PlaceWithRelations[];
      })
    | null;
};

// Add this before the MerchantDashboard component
type ReviewStatus = 'FEATURED' | 'HIDDEN' | 'DEFAULT';

export default function MerchantDashboard() {
  const queryClient = useQueryClient();
  const [state, dispatch] = useReducer(dashboardReducer, initialState);
  const [showPreview, setShowPreview] = useState<string | null>(null);
  const [editMode, setEditMode] = useState<Record<string, boolean>>({});
  const [reviewStatuses, setReviewStatuses] = useState<
    Record<string, ReviewStatus>
  >({});
  const [unsavedChanges, setUnsavedChanges] = useState<Record<string, boolean>>(
    {}
  );

  // Add mutation for updating review statuses
  const updateReviewsMutation = useMutation({
    mutationFn: async (
      updates: { reviewId: string; status: ReviewStatus }[]
    ) => {
      console.log({
        updates,
      });
      const response = await fetch('/api/merchant/reviews', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ updates }),
      });

      if (!response.ok) {
        throw new Error('Failed to update reviews');
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch the place details to get updated review statuses
      queryClient.invalidateQueries({
        queryKey: ['placeDetails', showPreview],
      });
    },
  });

  const { data: merchantData, isLoading: isLoadingMerchant } =
    useMerchantQuery();

  // Query for place details when preview is shown
  const { data: placeDetails, isLoading: isLoadingDetails } =
    usePlaceDetailsQuery({
      placeId: showPreview ?? '',
      enabled: !!showPreview,
    });

  // Query for place photos when preview is shown
  const { data: placePhotos, isLoading: isLoadingPhotos } = usePlacePhotosQuery(
    {
      placeId: showPreview ?? '',
      enabled: !!showPreview,
    }
  );

  const handleReviewStatusChange = (
    placeId: string,
    reviewId: string,
    status: ReviewStatus
  ) => {
    setReviewStatuses((prev) => ({
      ...prev,
      [reviewId]: status,
    }));
    setUnsavedChanges((prev) => ({
      ...prev,
      [placeId]: true,
    }));
  };

  const handleSaveChanges = (placeId: string) => {
    // Get all reviews that have been modified for this place
    const placeReviews = Object.entries(reviewStatuses)
      .map(([reviewId, status]) => ({ reviewId, status }))
      .filter((review) => review.status !== 'DEFAULT'); // Only include reviews with non-default status

    if (placeReviews.length > 0) {
      // Call the mutation to update review statuses
      updateReviewsMutation.mutate(placeReviews, {
        onSuccess: () => {
          // Clear unsaved changes for this place
          setUnsavedChanges((prev) => ({
            ...prev,
            [placeId]: false,
          }));
          // Clear review statuses
          setReviewStatuses({});
        },
        onError: (error) => {
          console.error('Failed to update reviews:', error);
          alert('Failed to save changes. Please try again.');
        },
      });
    } else {
      alert('No changes to save');
    }
  };

  const handleCloseDialog = () => {
    dispatch({ type: 'CLOSE_DIALOG' });
  };

  const handleClaimDialogOpenChange = useCallback((open: boolean) => {
    if (!open) {
      dispatch({ type: 'CLOSE_DIALOG' });
    } else {
      dispatch({ type: 'OPEN_CLAIM_DIALOG' });
    }
  }, []);

  return (
    <div className='container mx-auto py-8 space-y-8'>
      <div className='flex justify-between items-center'>
        <h1 className='text-4xl font-bold'>Merchant Dashboard</h1>
        <Button variant='outline'>Settings</Button>
      </div>

      {/* Stats Overview */}
      <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4'>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Places
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              {isLoadingMerchant ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-2xl font-bold'>
                  {merchantData?.merchant?.places?.length || 0}
                </div>
              )}
              <Store className='h-4 w-4 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Average Rating
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              {isLoadingMerchant ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-2xl font-bold'>
                  {merchantData?.merchant?.places?.length
                    ? merchantData.merchant.places.reduce<number>(
                        (acc, place) => acc + place.googleRating,
                        0
                      ) / merchantData.merchant.places.length
                    : '--'}
                </div>
              )}
              <Star className='h-4 w-4 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Reviews
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              {isLoadingMerchant ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-2xl font-bold'>
                  {merchantData?.merchant?.places?.reduce<number>(
                    (acc, place) => acc + (place.reviews?.length || 0),
                    0
                  ) || 0}
                </div>
              )}
              <MessageSquare className='h-4 w-4 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className='pb-2'>
            <CardTitle className='text-sm font-medium text-muted-foreground'>
              Total Photos
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className='flex items-center justify-between'>
              {isLoadingMerchant ? (
                <Skeleton className='h-8 w-16' />
              ) : (
                <div className='text-2xl font-bold'>
                  {merchantData?.merchant?.places?.reduce<number>(
                    (acc, place) => acc + (place.photos?.length || 0),
                    0
                  ) || 0}
                </div>
              )}
              {}
              <ImageIcon className='h-4 w-4 text-muted-foreground' />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Places List */}
      <div className='grid grid-cols-1 gap-6'>
        {isLoadingMerchant ? (
          <Card>
            <CardContent className='p-6'>
              <Skeleton className='h-24 w-full' />
            </CardContent>
          </Card>
        ) : merchantData?.merchant?.places?.length ? (
          merchantData.merchant.places.map((place: PlaceWithRelations) => (
            <Card key={place.id}>
              <CardContent className='p-6'>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-6'>
                  {/* Left Column - Basic Info */}
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <h3 className='font-semibold'>{place.name}</h3>
                    </div>
                    <div className='flex items-center gap-2'>
                      <p className='text-sm text-muted-foreground'>
                        {place.editorialSummary}
                      </p>
                    </div>
                    {place.address && (
                      <div className='flex items-center gap-2'>
                        <p className='text-sm text-muted-foreground'>
                          {place.address}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Middle Column - Stats */}
                  <div className='space-y-4'>
                    <div className='flex items-center gap-2'>
                      <Star className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>
                        {place.googleRating // comma separated thousands
                          ? place.googleRating.toLocaleString('en-US', {
                              maximumFractionDigits: 1,
                            })
                          : '--'}{' '}
                        (
                        {place.userRatingCount
                          ? place.userRatingCount.toLocaleString('en-US', {
                              maximumFractionDigits: 1,
                            })
                          : '--'}
                        ) ratings
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <MessageSquare className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>
                        {place.reviews.length} reviews
                      </p>
                    </div>
                    <div className='flex items-center gap-2'>
                      <ImageIcon className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>
                        {place.photos.length} photos
                      </p>
                    </div>
                  </div>

                  {/* Right Column - Actions */}
                  <div className='flex flex-col gap-4'>
                    <Button
                      variant='outline'
                      size='sm'
                      onClick={() =>
                        setShowPreview(
                          showPreview === place.id ? null : place.id
                        )
                      }
                    >
                      {showPreview === place.id
                        ? 'Hide Preview'
                        : 'View App Preview'}
                    </Button>
                    <Button
                      variant={editMode[place.id] ? 'secondary' : 'outline'}
                      size='sm'
                      onClick={() =>
                        setEditMode((prev) => ({
                          ...prev,
                          [place.id]: !prev[place.id],
                        }))
                      }
                    >
                      {editMode[place.id] ? 'Exit Edit Mode' : 'Edit Place'}
                    </Button>
                    {editMode[place.id] && unsavedChanges[place.id] && (
                      <Button
                        variant='default'
                        size='sm'
                        onClick={() => handleSaveChanges(place.id)}
                      >
                        Save Changes
                      </Button>
                    )}
                  </div>
                </div>

                {/* App Preview Section */}
                {showPreview === place.id && (
                  <div className='mt-6 border-t pt-6'>
                    <div className='space-y-6'>
                      {isLoadingDetails || isLoadingPhotos ? (
                        <div className='space-y-4'>
                          <Skeleton className='h-8 w-72' />
                          <div className='space-y-2'>
                            <Skeleton className='h-4 w-full' />
                            <Skeleton className='h-4 w-3/4' />
                            <Skeleton className='h-4 w-1/2' />
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Place Header with Emoji */}
                          {placeDetails?.data && (
                            <div className='p-6 bg-yellow-100/30 rounded-xl shadow-sm'>
                              <div className='flex items-start gap-4'>
                                {/* Emoji Circle */}
                                <div className='flex-shrink-0'>
                                  <div className='w-16 h-16 flex items-center justify-center bg-white/60 rounded-full shadow-sm'>
                                    <span className='text-4xl'>🏠</span>
                                  </div>
                                </div>

                                {/* Place Info */}
                                <div className='flex-grow space-y-2'>
                                  <h3 className='text-xl font-bold'>
                                    {placeDetails.data.name}
                                  </h3>
                                  <div className='flex items-center gap-2 text-sm text-muted-foreground'>
                                    <span>
                                      {placeDetails.data.primaryTypeDisplayName}
                                    </span>
                                    {placeDetails.data.priceLevel && (
                                      <>
                                        <span>·</span>
                                        <span className='font-semibold'>
                                          {Array(placeDetails.data.priceLevel)
                                            .fill('$')
                                            .join('')}
                                        </span>
                                      </>
                                    )}
                                  </div>
                                  {/* Rating Stars */}
                                  {placeDetails.data.googleRating && (
                                    <div className='flex items-center gap-2'>
                                      <div className='flex'>
                                        {[1, 2, 3, 4, 5].map((star) => (
                                          <Star
                                            key={star}
                                            className={`w-3 h-3 ${
                                              star <=
                                              Math.round(
                                                placeDetails.data
                                                  .googleRating ?? 0
                                              )
                                                ? 'fill-yellow-400 text-yellow-400'
                                                : 'fill-gray-200 text-gray-200'
                                            }`}
                                          />
                                        ))}
                                      </div>
                                      {placeDetails.data.userRatingCount && (
                                        <span className='text-xs text-muted-foreground'>
                                          {placeDetails.data.userRatingCount >=
                                          1000000
                                            ? `(${(
                                                placeDetails.data
                                                  .userRatingCount / 1000000
                                              ).toFixed(1)}M)`
                                            : placeDetails.data
                                                .userRatingCount >= 1000
                                            ? `(${(
                                                placeDetails.data
                                                  .userRatingCount / 1000
                                              ).toFixed(1)}K)`
                                            : `(${placeDetails.data.userRatingCount})`}
                                        </span>
                                      )}
                                    </div>
                                  )}
                                </div>

                                {/* Heart Button */}
                                <button className='flex-shrink-0 w-12 h-12 flex items-center justify-center bg-white/60 rounded-full'>
                                  <Heart className='w-6 h-6 text-gray-400' />
                                </button>
                              </div>
                            </div>
                          )}

                          {/* Features Grid */}
                          {placeDetails?.data && (
                            <div className='space-y-3'>
                              <div className='flex items-center gap-2 px-4'>
                                <Star className='w-5 h-5 text-orange-500 fill-orange-500' />
                                <h4 className='font-semibold'>Features</h4>
                              </div>
                              <div className='grid grid-cols-2 gap-3 px-4'>
                                {placeDetails.data.openNow && (
                                  <div className='flex items-center gap-2 p-3 bg-green-100/50 rounded-lg'>
                                    <div className='w-8 h-8 flex items-center justify-center bg-green-500 rounded-full'>
                                      <Clock className='w-4 h-4 text-white' />
                                    </div>
                                    <span className='text-sm'>Open Now</span>
                                  </div>
                                )}
                                {placeDetails.data.takeout && (
                                  <div className='flex items-center gap-2 p-3 bg-blue-100/50 rounded-lg'>
                                    <div className='w-8 h-8 flex items-center justify-center bg-blue-500 rounded-full'>
                                      <ShoppingBag className='w-4 h-4 text-white' />
                                    </div>
                                    <span className='text-sm'>Takeout</span>
                                  </div>
                                )}
                                {placeDetails.data.delivery && (
                                  <div className='flex items-center gap-2 p-3 bg-orange-100/50 rounded-lg'>
                                    <div className='w-8 h-8 flex items-center justify-center bg-orange-500 rounded-full'>
                                      <Bike className='w-4 h-4 text-white' />
                                    </div>
                                    <span className='text-sm'>Delivery</span>
                                  </div>
                                )}
                                {placeDetails.data.dineIn && (
                                  <div className='flex items-center gap-2 p-3 bg-purple-100/50 rounded-lg'>
                                    <div className='w-8 h-8 flex items-center justify-center bg-purple-500 rounded-full'>
                                      <Utensils className='w-4 h-4 text-white' />
                                    </div>
                                    <span className='text-sm'>Dine-in</span>
                                  </div>
                                )}
                                {placeDetails.data.outdoorSeating && (
                                  <div className='flex items-center gap-2 p-3 bg-yellow-100/50 rounded-lg'>
                                    <div className='w-8 h-8 flex items-center justify-center bg-yellow-500 rounded-full'>
                                      <Sun className='w-4 h-4 text-white' />
                                    </div>
                                    <span className='text-sm'>
                                      Outdoor Seating
                                    </span>
                                  </div>
                                )}
                                {placeDetails.data.servesCoffee && (
                                  <div className='flex items-center gap-2 p-3 bg-amber-100/50 rounded-lg'>
                                    <div className='w-8 h-8 flex items-center justify-center bg-amber-700 rounded-full'>
                                      <Coffee className='w-4 h-4 text-white' />
                                    </div>
                                    <span className='text-sm'>Coffee</span>
                                  </div>
                                )}
                                {placeDetails.data.servesDessert && (
                                  <div className='flex items-center gap-2 p-3 bg-pink-100/50 rounded-lg'>
                                    <div className='w-8 h-8 flex items-center justify-center bg-pink-500 rounded-full'>
                                      <Cake className='w-4 h-4 text-white' />
                                    </div>
                                    <span className='text-sm'>Dessert</span>
                                  </div>
                                )}
                                {placeDetails.data.goodForGroups && (
                                  <div className='flex items-center gap-2 p-3 bg-indigo-100/50 rounded-lg'>
                                    <div className='w-8 h-8 flex items-center justify-center bg-indigo-500 rounded-full'>
                                      <Users className='w-4 h-4 text-white' />
                                    </div>
                                    <span className='text-sm'>
                                      Good for Groups
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          )}

                          {/* Photos Horizontal Scroll */}
                          {placePhotos?.data && placePhotos.data.length > 0 && (
                            <div className='space-y-3'>
                              <div className='flex items-center gap-2 px-4'>
                                <ImageIcon className='w-5 h-5 text-purple-500' />
                                <h4 className='font-semibold'>Photos</h4>
                              </div>
                              <div className='relative'>
                                <div className='flex gap-3 overflow-x-auto px-4 pb-4 -mx-4 scrollbar-hide'>
                                  {placePhotos.data.map((photoUrl, index) => (
                                    <div
                                      key={index}
                                      className='relative flex-shrink-0 w-[150px] h-[150px] rounded-xl overflow-hidden shadow-sm'
                                    >
                                      <Image
                                        src={photoUrl.toString()}
                                        alt={`Place photo ${index + 1}`}
                                        width={150}
                                        height={150}
                                        className='object-cover w-full h-full'
                                        unoptimized={true}
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            </div>
                          )}

                          {/* Reviews Section */}
                          {placeDetails?.data?.reviews &&
                            placeDetails.data.reviews.length > 0 && (
                              <div className='space-y-3'>
                                <div className='flex items-center justify-between px-4'>
                                  <div className='flex items-center gap-2'>
                                    <MessageSquare className='w-5 h-5 text-blue-500' />
                                    <h4 className='font-semibold'>Reviews</h4>
                                  </div>
                                </div>
                                <div className='space-y-3 px-4'>
                                  {placeDetails.data.reviews.map((review) => {
                                    const reviewId = review.id;
                                    // Use the review's status from database unless there's a pending change
                                    const status =
                                      reviewId in reviewStatuses
                                        ? reviewStatuses[reviewId]
                                        : review.status;

                                    return (
                                      <div
                                        key={reviewId}
                                        className={`p-4 rounded-lg space-y-2 ${
                                          status === 'FEATURED'
                                            ? 'bg-blue-100/50 border border-blue-200'
                                            : status === 'HIDDEN'
                                            ? 'bg-gray-100/30 border border-gray-200 opacity-50'
                                            : 'bg-gray-100/50'
                                        }`}
                                      >
                                        <div className='flex items-center justify-between'>
                                          <div className='flex gap-1'>
                                            {[1, 2, 3, 4, 5].map((star) => (
                                              <Star
                                                key={star}
                                                className={`w-3 h-3 ${
                                                  star <= review.rating
                                                    ? 'fill-yellow-400 text-yellow-400'
                                                    : 'fill-gray-200 text-gray-200'
                                                }`}
                                              />
                                            ))}
                                          </div>
                                          <div className='flex items-center gap-2'>
                                            <span className='text-xs text-muted-foreground'>
                                              {
                                                review.relativePublishTimeDescription
                                              }
                                            </span>
                                            <DropdownMenu>
                                              <DropdownMenuTrigger asChild>
                                                {editMode[place.id] && (
                                                  <Button
                                                    variant='ghost'
                                                    size='icon'
                                                    className='h-6 w-6'
                                                  >
                                                    <MoreVertical className='h-4 w-4' />
                                                  </Button>
                                                )}
                                              </DropdownMenuTrigger>
                                              <DropdownMenuContent align='end'>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    handleReviewStatusChange(
                                                      place.id,
                                                      reviewId,
                                                      'FEATURED'
                                                    )
                                                  }
                                                >
                                                  Feature Review
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    handleReviewStatusChange(
                                                      place.id,
                                                      reviewId,
                                                      'HIDDEN'
                                                    )
                                                  }
                                                >
                                                  Hide Review
                                                </DropdownMenuItem>
                                                <DropdownMenuItem
                                                  onClick={() =>
                                                    handleReviewStatusChange(
                                                      place.id,
                                                      reviewId,
                                                      'DEFAULT'
                                                    )
                                                  }
                                                >
                                                  Reset Status
                                                </DropdownMenuItem>
                                              </DropdownMenuContent>
                                            </DropdownMenu>
                                          </div>
                                        </div>
                                        <p className='text-sm line-clamp-3'>
                                          {review.text
                                            ? typeof review.text === 'string'
                                              ? review.text
                                              : 'No review text'
                                            : 'No review text'}
                                        </p>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        ) : (
          <Card>
            <CardContent className='p-6'>
              <div className='text-center py-6'>
                <Store className='h-12 w-12 text-muted-foreground mx-auto mb-4' />
                <h3 className='text-lg font-semibold mb-2'>No Places Yet</h3>
                <p className='text-muted-foreground mb-4'>
                  You haven&apos;t claimed any places yet. Start by claiming
                  your first business.
                </p>
                <Button onClick={() => dispatch({ type: 'OPEN_CLAIM_DIALOG' })}>
                  Claim a Place
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Dialogs */}
      <ClaimDialog
        isOpen={state.dialogState === 'claim'}
        onOpenChange={handleClaimDialogOpenChange}
        state={state}
        dispatch={dispatch}
      />

      {/* Loading Dialog */}
      <Dialog
        open={state.dialogState === 'loading'}
        onOpenChange={(open) => {
          if (!open) {
            handleCloseDialog();
          }
        }}
      >
        <DialogContent className='sm:max-w-[400px]'>
          <DialogHeader>
            <DialogTitle>Processing Your Request</DialogTitle>
            <DialogDescription>
              Please wait while we process your business claim request.
            </DialogDescription>
          </DialogHeader>
          <div className='space-y-6 py-4'>
            {state.loadingSteps.map((step, index) => (
              <div key={index} className='flex items-center gap-4'>
                <div className='flex-1'>
                  {step.status === 'pending' ? (
                    <Skeleton className='h-4 w-[200px]' />
                  ) : (
                    <p
                      className={
                        step.status === 'error'
                          ? 'text-destructive'
                          : 'text-muted-foreground'
                      }
                    >
                      {step.message}
                    </p>
                  )}
                </div>
                <div className='flex-shrink-0'>
                  {step.status === 'pending' && (
                    <div className='h-4 w-4 animate-spin rounded-full border-2 border-primary border-t-transparent' />
                  )}
                  {step.status === 'complete' && (
                    <div className='h-4 w-4 rounded-full bg-primary' />
                  )}
                  {step.status === 'error' && (
                    <div className='h-4 w-4 rounded-full bg-destructive' />
                  )}
                </div>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Place List Dialog */}
      <PlaceListDialog
        handleCloseDialog={handleCloseDialog}
        state={state}
        dispatch={dispatch}
      />

      {/* Verify Phone Dialog */}
      <VerifyDialog
        handleCloseDialog={handleCloseDialog}
        state={state}
        dispatch={dispatch}
      />
    </div>
  );
}
