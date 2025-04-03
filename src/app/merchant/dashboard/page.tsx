'use client';

import { useReducer, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin,
  Star,
  Image as ImageIcon,
  MessageSquare,
  Store,
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
import { Skeleton } from '@/components/ui/skeleton';
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

export default function MerchantDashboard() {
  const [state, dispatch] = useReducer(dashboardReducer, initialState);

  const { data: merchantData, isLoading: isLoadingMerchant } =
    useQuery<MerchantResponse>({
      queryKey: ['merchant'],
      queryFn: async () => {
        const response = await fetch('/api/merchant');
        if (!response.ok) {
          throw new Error('Failed to fetch merchant data');
        }
        return response.json();
      },
    });

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
                    ? (
                        merchantData.merchant.places.reduce<number>(
                          (acc, place) =>
                            acc +
                            place.ratings.reduce<number>(
                              (sum, r) => sum + r.rating,
                              0
                            ) /
                              (place.ratings.length || 1),
                          0
                        ) / merchantData.merchant.places.length
                      ).toFixed(1)
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
                      <Store className='h-4 w-4 text-muted-foreground' />
                      <h3 className='font-semibold'>{place.name}</h3>
                    </div>
                    <div className='flex items-center gap-2'>
                      <MapPin className='h-4 w-4 text-muted-foreground' />
                      <p className='text-sm text-muted-foreground'>
                        {place.editorialSummary ||
                          place.generativeSummary ||
                          'No description available'}
                      </p>
                    </div>
                    {place.address && (
                      <div className='flex items-center gap-2'>
                        <MapPin className='h-4 w-4 text-muted-foreground' />
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
                        {place.ratings.length > 0
                          ? (
                              place.ratings.reduce(
                                (sum, r) => sum + r.rating,
                                0
                              ) / place.ratings.length
                            ).toFixed(1)
                          : '--'}{' '}
                        ({place.ratings.length} ratings)
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
                    <Button variant='outline' size='sm'>
                      View Details
                    </Button>
                    <Button variant='outline' size='sm'>
                      Edit Place
                    </Button>
                  </div>
                </div>
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
