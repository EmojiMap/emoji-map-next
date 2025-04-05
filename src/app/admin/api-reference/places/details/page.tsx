'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { useQueryClient } from '@tanstack/react-query';
import { ChevronDownIcon, ChevronUpIcon, Star } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import { z } from 'zod';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useFavoriteStatusQuery } from '@/hooks/use-favorite-status-query/use-favorite-status-query';
import { usePlaceDetailsQuery } from '@/hooks/use-place-details-query/use-place-details-query';
import { useRatingQuery } from '@/hooks/use-rating-query/use-rating-query';
import { useToggleFavoriteMutation } from '@/hooks/use-toggle-favorite-mutation/use-toggle-favorite-mutation';
import { useUpdateRatingsMutation } from '@/hooks/use-update-ratings-mutation/use-update-ratings-mutation';
import { cn } from '@/lib/utils';

// Form schema for place details
const detailsFormSchema = z.object({
  placeId: z.string().min(1, {
    message: 'Place ID is required',
  }),
  bypassCache: z.boolean().default(false),
  showRawJson: z.boolean().default(false),
});

// Type inference for our form values
type DetailsFormValues = z.infer<typeof detailsFormSchema>;

// Skeleton component for place details
const PlaceDetailsSkeleton = () => {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-72' /> {/* Title skeleton */}
        <div className='p-3 border rounded-md bg-muted'>
          <div className='space-y-3'>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-5 w-20' /> {/* Label skeleton */}
              <Skeleton className='h-5 w-40' /> {/* Value skeleton */}
            </div>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-5 w-24' /> {/* Label skeleton */}
              <Skeleton className='h-5 w-32' /> {/* Value skeleton */}
            </div>
            <div className='flex justify-between items-center'>
              <Skeleton className='h-5 w-28' /> {/* Label skeleton */}
              <Skeleton className='h-5 w-24' /> {/* Value skeleton */}
            </div>
          </div>
        </div>
      </div>

      {/* Multiple sections skeletons */}
      {[1, 2, 3].map((section) => (
        <div key={section} className='p-3 border rounded-md bg-muted'>
          <Skeleton className='h-5 w-32 mb-3' /> {/* Section title skeleton */}
          <div className='space-y-2'>
            {[1, 2, 3].map((item) => (
              <div key={item} className='flex justify-between items-center'>
                <Skeleton className='h-4 w-24' /> {/* Label skeleton */}
                <Skeleton className='h-4 w-28' /> {/* Value skeleton */}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

// Create a client component for the form
function DetailsForm() {
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();
  const router = useRouter();

  // State for request details debug information
  const [lastRequest, setLastRequest] = useState<{
    url: string;
    params: string;
  } | null>(null);
  const [isRequestDetailsExpanded, setIsRequestDetailsExpanded] =
    useState(false);

  // Initialize form with values from URL if available
  const form = useForm<DetailsFormValues>({
    resolver: zodResolver(detailsFormSchema),
    defaultValues: {
      placeId: searchParams.get('id') || '',
      bypassCache: false,
      showRawJson: false,
    },
  });

  // Watch form values for the query
  const placeId = form.watch('placeId');
  const bypassCache = form.watch('bypassCache');
  const showRawJson = form.watch('showRawJson');

  // TanStack Query for place details
  const placeDetailsQuery = usePlaceDetailsQuery({
    placeId,
    bypassCache,
    setLastRequest,
    enabled: false, // Don't run automatically on mount or when placeId changes
  });

  // Query for favorite status
  const favoriteStatusQuery = useFavoriteStatusQuery({
    enabled: !!placeId && !!placeDetailsQuery.data?.data?.id,
    placeId,
  });

  // Query for rating
  const ratingQuery = useRatingQuery({
    placeId,
    enabled: !!placeId && !!placeDetailsQuery.data?.data?.id,
  });

  const { mutate: toggleFavorite, isPending: isTogglingFavorite } =
    useToggleFavoriteMutation({
      onSuccess: () => {
        let oldStatus;
        // Update the favorite status query cache
        queryClient.setQueryData(
          ['favoriteStatus', placeId],
          (oldData: { isFavorite: boolean }) => {
            oldStatus = oldData.isFavorite;
            return {
              ...oldData,
              isFavorite: !oldData.isFavorite,
            };
          }
        );

        // Invalidate user query
        queryClient.invalidateQueries({ queryKey: ['user'] });

        toast.success(`Place ${oldStatus ? 'unfavorited' : 'favorited'}`);
      },
      onError: (error) => {
        toast.error(`Failed to toggle favorite: ${error.message}`);
      },
    });

  const { mutate: updateRating, isPending: isUpdatingRating } =
    useUpdateRatingsMutation({
      onSuccess: ({ rating }) => {
        // Update the rating query cache
        queryClient.setQueryData(
          ['rating', placeId],
          (oldData: { rating: number | null }) => ({
            ...oldData,
            rating: rating === oldData.rating ? null : rating,
          })
        );

        // Invalidate user query
        queryClient.invalidateQueries({ queryKey: ['user'] });

        toast.success(`Place rating updated`);
      },
      onError: (error) => {
        toast.error(`Failed to update rating: ${error.message}`);
      },
    });

  // Function to clear place details query data
  const handleClearPlaceDetails = () => {
    queryClient.resetQueries({ queryKey: ['placeDetails'] });
    form.reset({ ...form.getValues(), placeId: '' });
    setLastRequest(null);
    toast.success('Place details results cleared');
  };

  // Reset form and query states
  const handleReset = () => {
    form.reset({
      placeId: '',
      bypassCache: false,
      showRawJson: false,
    });
    setLastRequest(null);
    queryClient.resetQueries({ queryKey: ['placeDetails'] });
    toast.success('Form has been reset');
  };

  // Form submit handler
  const onSubmit = () => {
    // Refetch with current form values
    placeDetailsQuery.refetch();
  };

  // Helper function to render a detail field if it exists
  const renderDetailField = (label: string, value: unknown) => {
    if (value === undefined || value === null) return null;

    // Format the value based on its type
    let formattedValue: string;
    if (typeof value === 'boolean') {
      formattedValue = value ? 'Yes' : 'No';
    } else if (typeof value === 'object') {
      // Handle objects that might have a text property
      if (
        value &&
        'text' in value &&
        typeof (value as { text: unknown }).text === 'string'
      ) {
        formattedValue = (value as { text: string }).text;
      } else {
        // For other objects, stringify them
        formattedValue = JSON.stringify(value);
      }
    } else {
      formattedValue = String(value);
    }

    return (
      <div
        className='flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0'
        key={label}
      >
        <span className='font-medium'>{label}:</span>
        <span className='text-right max-w-[60%]'>{formattedValue}</span>
      </div>
    );
  };

  // Helper function to format keys from camelCase to Title Case With Spaces
  const formatFieldName = (key: string): string => {
    // Handle payment related fields specially
    if (key.startsWith('accepts') || key.includes('Cash')) {
      return (
        key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, (str) => str.toUpperCase())
          // Add "Accepts" prefix if not present, e.g. for CashOnly -> Accepts Cash Only
          .replace(/^([^A]*)Cash Only/i, 'Accepts Cash Only')
          // More readable versions of payment options
          .replace(/^Accepts Debit Cards/i, 'Accepts Debit Cards')
          .replace(/^Accepts Credit Cards/i, 'Accepts Credit Cards')
          .trim()
      );
    }

    // Regular fields
    return (
      key
        // Insert space before capital letters
        .replace(/([A-Z])/g, ' $1')
        // Capitalize first letter
        .replace(/^./, (str) => str.toUpperCase())
        // Handle specific cases for better readability
        .replace('User Rating Count', 'User Ratings')
        .replace('Primary Type Display Name', 'Primary Type')
        .replace('Display Name', 'Name')
        .replace('Open Now', 'Currently Open')
        .replace('Outdoor Seating', 'Has Outdoor Seating')
        .replace('Dine In', 'Offers Dine-In')
        .trim()
    );
  };

  // Helper function to render star rating
  const StarRating = () => {
    const [hoverRating, setHoverRating] = useState<number | null>(null);
    const currentRating = ratingQuery.data?.rating || 0;
    const displayRating = hoverRating !== null ? hoverRating : currentRating;
    const isDisabled = isUpdatingRating;

    return (
      <div className='flex items-center gap-1 px-2 py-1 border rounded-md'>
        {[1, 2, 3, 4, 5].map((rating) => (
          <Star
            key={rating}
            className={cn(`
              h-4 w-4 cursor-pointer transition-colors
              ${
                isDisabled
                  ? 'cursor-not-allowed animate-pulse'
                  : 'cursor-pointer'
              }
              ${
                rating <= displayRating
                  ? 'fill-yellow-400 text-yellow-400'
                  : 'fill-none text-gray-300'
              }
            `)}
            onMouseEnter={() => setHoverRating(rating)}
            onMouseLeave={() => setHoverRating(null)}
            onClick={() => {
              if (!isUpdatingRating) {
                updateRating({
                  placeId,
                  rating,
                });
              }
            }}
          />
        ))}
      </div>
    );
  };

  return (
    <div className='flex flex-col gap-8 p-4'>
      {/* Search Form Card */}
      <Card>
        <CardHeader>
          <CardTitle>Details Parameters</CardTitle>
          <CardDescription>
            Configure your place details request
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6'>
              <div className='grid grid-cols-1 gap-6'>
                {/* Place ID Field */}
                <FormField
                  control={form.control}
                  name='placeId'
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Place ID</FormLabel>
                      <FormControl>
                        <Input
                          placeholder='Enter a Google Places ID'
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter a valid Google Places ID to fetch details
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Checkboxes in a row */}
              <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                <FormField
                  control={form.control}
                  name='bypassCache'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>Bypass Cache</FormLabel>
                        <FormDescription>
                          Force a fresh request to the API
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name='showRawJson'
                  render={({ field }) => (
                    <FormItem className='flex flex-row items-start space-x-3 space-y-0'>
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                      </FormControl>
                      <div className='space-y-1 leading-none'>
                        <FormLabel>Show Raw JSON</FormLabel>
                        <FormDescription>
                          Display the raw API response
                        </FormDescription>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className='flex justify-between pt-2'>
                <Button type='button' variant='outline' onClick={handleReset}>
                  Reset
                </Button>
                <Button type='submit' disabled={placeDetailsQuery.isFetching}>
                  {placeDetailsQuery.isFetching ? 'Loading...' : 'Get Details'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Results Card */}
      <Card>
        <CardHeader>
          <div className='flex justify-between items-center'>
            <div className='space-y-1.5'>
              <CardTitle>Details Results</CardTitle>
              <CardDescription>Place information and metadata</CardDescription>
            </div>
            {placeDetailsQuery.data && (
              <div className='flex gap-2 items-center'>
                {/* Rating Stars */}
                {placeDetailsQuery.data.data?.id && <StarRating />}

                {/* Favorite Button */}
                <Button
                  variant={
                    favoriteStatusQuery.data?.isFavorite
                      ? 'destructive'
                      : 'outline'
                  }
                  size='sm'
                  onClick={() =>
                    toggleFavorite({ placeId: placeDetailsQuery.data.data?.id })
                  }
                  disabled={
                    !placeDetailsQuery.data.data?.id ||
                    isTogglingFavorite ||
                    favoriteStatusQuery.isLoading
                  }
                >
                  {isTogglingFavorite
                    ? 'Updating...'
                    : favoriteStatusQuery.data?.isFavorite
                    ? 'Unfavorite'
                    : 'Favorite'}
                </Button>

                {/* Photos Button */}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={() => {
                    router.push(
                      `/admin/api-reference/places/photos?id=${placeDetailsQuery.data.data?.id}`
                    );
                  }}
                  disabled={!placeDetailsQuery.data.data?.id}
                >
                  Get Photos
                </Button>

                {/* Clear Results Button */}
                <Button
                  variant='outline'
                  size='sm'
                  onClick={handleClearPlaceDetails}
                >
                  Clear Results
                </Button>
              </div>
            )}
          </div>
        </CardHeader>
        <CardContent className='overflow-hidden'>
          {placeDetailsQuery.isError && (
            <div className='p-4 mb-4 border border-destructive/50 bg-destructive/10 text-destructive rounded-md'>
              <p className='font-bold'>Error</p>
              <p>
                {placeDetailsQuery.error?.message ||
                  'An unknown error occurred'}
              </p>
            </div>
          )}

          {/* Request Debug Information */}
          {lastRequest && (
            <div className='mb-4 border rounded-md overflow-hidden'>
              <div
                className='bg-slate-100 dark:bg-slate-800 px-4 py-2 flex justify-between items-center cursor-pointer'
                onClick={() =>
                  setIsRequestDetailsExpanded(!isRequestDetailsExpanded)
                }
              >
                <div className='flex items-center gap-2'>
                  <h3 className='text-sm font-medium'>Request Details</h3>
                  {isRequestDetailsExpanded ? (
                    <ChevronUpIcon className='h-4 w-4' />
                  ) : (
                    <ChevronDownIcon className='h-4 w-4' />
                  )}
                </div>
                <Button
                  variant='ghost'
                  size='sm'
                  onClick={(e) => {
                    e.stopPropagation(); // Prevent toggling when copying
                    const fullRequestDetails = `URL: ${lastRequest.url}?${lastRequest.params}\nMethod: GET`;
                    navigator.clipboard
                      .writeText(fullRequestDetails)
                      .then(() =>
                        toast.success('Request details copied to clipboard')
                      )
                      .catch(() =>
                        toast.error('Failed to copy request details')
                      );
                  }}
                >
                  Copy All
                </Button>
              </div>

              {isRequestDetailsExpanded && (
                <div className='p-3 border-b bg-muted/30'>
                  <div className='flex justify-between items-center'>
                    <div>
                      <span className='font-medium text-sm'>Endpoint:</span>
                      <code className='ml-2 text-sm bg-muted px-1 py-0.5 rounded'>{`${lastRequest.url}?${lastRequest.params}`}</code>
                    </div>
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={(e) => {
                        e.stopPropagation(); // Prevent toggling when copying
                        navigator.clipboard
                          .writeText(`${lastRequest.url}?${lastRequest.params}`)
                          .then(() => toast.success('URL copied to clipboard'))
                          .catch(() => toast.error('Failed to copy URL'));
                      }}
                    >
                      Copy
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className='min-h-[400px]'>
            {placeDetailsQuery.isFetching ? (
              <div className='space-y-4'>
                <div className='p-3 border rounded-md mb-4 bg-muted/30'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='font-medium'>Cache Hit:</span>
                    <Skeleton className='h-4 w-10' />
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Count:</span>
                    <Skeleton className='h-4 w-8' />
                  </div>
                </div>

                <Separator className='my-4' />

                <h3 className='text-lg font-semibold mb-3'>
                  Loading place details...
                </h3>
                <PlaceDetailsSkeleton />
              </div>
            ) : placeDetailsQuery.data ? (
              <div className='flex flex-col'>
                {/* Cache info and result count */}
                <div className='p-3 border rounded-md mb-4 bg-muted/30'>
                  <div className='flex justify-between items-center mb-2'>
                    <span className='font-medium'>Cache Hit:</span>
                    <span>
                      {placeDetailsQuery.data.cacheHit ? 'Yes' : 'No'}
                    </span>
                  </div>
                  <div className='flex justify-between items-center'>
                    <span className='font-medium'>Count:</span>
                    <span>{placeDetailsQuery.data.count}</span>
                  </div>
                </div>

                <Separator className='my-4' />

                {/* Display results */}
                {showRawJson ? (
                  <div className='relative h-[500px] overflow-hidden'>
                    <div className='absolute inset-0 overflow-auto bg-muted p-4 rounded-md'>
                      <pre className='text-xs'>
                        {JSON.stringify(placeDetailsQuery.data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className='relative h-[600px] overflow-hidden'>
                    <div className='absolute inset-0 overflow-auto pr-1 border border-muted rounded-md'>
                      <div className='space-y-4 p-4'>
                        {placeDetailsQuery.data.data && (
                          <>
                            {/* Name and basic info */}
                            <h3 className='text-lg font-semibold'>
                              {placeDetailsQuery.data.data.displayName ||
                                'Name not available'}
                            </h3>

                            <div className='p-3 border rounded-md bg-muted/30'>
                              <div className='space-y-1'>
                                {renderDetailField(
                                  formatFieldName('Name'),
                                  placeDetailsQuery.data.data.displayName
                                )}
                                {renderDetailField(
                                  'Google Place ID',
                                  placeDetailsQuery.data.data.id
                                )}
                                {renderDetailField(
                                  formatFieldName('PrimaryType'),
                                  placeDetailsQuery.data.data
                                    .primaryTypeDisplayName
                                )}
                                {renderDetailField(
                                  'Address',
                                  placeDetailsQuery.data.data.address
                                )}
                                {renderDetailField(
                                  'Latitude',
                                  placeDetailsQuery.data.data.location.latitude
                                )}
                                {renderDetailField(
                                  'Longitude',
                                  placeDetailsQuery.data.data.location.longitude
                                )}

                                <div className='flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0'>
                                  <span className='font-medium'>Rating:</span>
                                  <div className='text-right max-w-[60%] flex items-center gap-2'>
                                    <div className='flex'>
                                      {[1, 2, 3, 4, 5].map((star) => (
                                        <span
                                          key={`rating-star-${star}`}
                                          className={`text-xl ${
                                            (placeDetailsQuery.data.data
                                              .rating || 0) >= star
                                              ? 'text-yellow-400'
                                              : (placeDetailsQuery.data.data
                                                  .rating || 0) >=
                                                star - 0.5
                                              ? 'text-yellow-400/70'
                                              : 'text-gray-300'
                                          }`}
                                        >
                                          ★
                                        </span>
                                      ))}
                                    </div>
                                    <span>
                                      (
                                      {placeDetailsQuery.data.data.rating ||
                                        'No rating'}
                                      )
                                    </span>
                                  </div>
                                </div>

                                <div className='flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0'>
                                  <span className='font-medium'>
                                    Price Level:
                                  </span>
                                  <div className='text-right max-w-[60%]'>
                                    {placeDetailsQuery.data.data.priceLevel ===
                                    null ? (
                                      <span>Not specified</span>
                                    ) : (
                                      <span>
                                        {'$'.repeat(
                                          placeDetailsQuery.data.data.priceLevel
                                        )}
                                      </span>
                                    )}
                                    {placeDetailsQuery.data.data.isFree && (
                                      <span className='ml-2 text-green-400'>
                                        (Free)
                                      </span>
                                    )}
                                  </div>
                                </div>

                                {renderDetailField(
                                  formatFieldName('userRatingCount'),
                                  placeDetailsQuery.data.data.userRatingCount
                                )}
                                {renderDetailField(
                                  formatFieldName('openNow'),
                                  placeDetailsQuery.data.data.openNow
                                )}
                              </div>
                            </div>

                            {/* Service Options */}
                            <div className='p-3 border rounded-md bg-muted/30'>
                              <p className='text-sm font-medium mb-2'>
                                Service Options:
                              </p>
                              <div className='space-y-1'>
                                {renderDetailField(
                                  formatFieldName('takeout'),
                                  placeDetailsQuery.data.data.takeout
                                )}
                                {renderDetailField(
                                  formatFieldName('delivery'),
                                  placeDetailsQuery.data.data.delivery
                                )}
                                {renderDetailField(
                                  formatFieldName('dineIn'),
                                  placeDetailsQuery.data.data.dineIn
                                )}
                                {renderDetailField(
                                  formatFieldName('outdoorSeating'),
                                  placeDetailsQuery.data.data.outdoorSeating
                                )}
                              </div>
                            </div>

                            {/* Features */}
                            <div className='p-3 border rounded-md bg-muted/30'>
                              <p className='text-sm font-medium mb-2'>
                                Features:
                              </p>
                              <div className='space-y-1'>
                                {renderDetailField(
                                  formatFieldName('liveMusic'),
                                  placeDetailsQuery.data.data.liveMusic
                                )}
                                {renderDetailField(
                                  formatFieldName('menuForChildren'),
                                  placeDetailsQuery.data.data.menuForChildren
                                )}
                                {renderDetailField(
                                  formatFieldName('servesDessert'),
                                  placeDetailsQuery.data.data.servesDessert
                                )}
                                {renderDetailField(
                                  formatFieldName('servesCoffee'),
                                  placeDetailsQuery.data.data.servesCoffee
                                )}
                                {renderDetailField(
                                  formatFieldName('goodForChildren'),
                                  placeDetailsQuery.data.data.goodForChildren
                                )}
                                {renderDetailField(
                                  formatFieldName('goodForGroups'),
                                  placeDetailsQuery.data.data.goodForGroups
                                )}
                                {renderDetailField(
                                  formatFieldName('allowsDogs'),
                                  placeDetailsQuery.data.data.allowsDogs
                                )}
                                {renderDetailField(
                                  formatFieldName('restroom'),
                                  placeDetailsQuery.data.data.restroom
                                )}
                              </div>
                            </div>

                            {/* Payment Options */}
                            {placeDetailsQuery.data.data.paymentOptions && (
                              <div className='p-3 border rounded-md bg-muted/30'>
                                <p className='text-sm font-medium mb-2'>
                                  Payment Options:
                                </p>
                                <div className='space-y-1'>
                                  {Object.entries(
                                    placeDetailsQuery.data.data.paymentOptions
                                  ).map(([key, value]) => {
                                    const formattedKey = formatFieldName(key);
                                    return renderDetailField(
                                      formattedKey,
                                      value
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Editorial Summary */}
                            <div className='p-3 border rounded-md bg-muted/30'>
                              <p className='text-sm font-medium mb-2'>
                                Editorial Summary:
                              </p>
                              {placeDetailsQuery.data.data.editorialSummary ? (
                                <p className='text-sm'>
                                  {placeDetailsQuery.data.data.editorialSummary}
                                </p>
                              ) : (
                                <p className='text-sm text-muted-foreground'>
                                  No editorial summary available
                                </p>
                              )}
                            </div>

                            {/* Generative Summary */}
                            <div className='p-3 border rounded-md bg-muted/30'>
                              <p className='text-sm font-medium mb-2'>
                                Generative Summary:
                              </p>
                              {placeDetailsQuery.data.data.generativeSummary ? (
                                <p className='text-sm'>
                                  {
                                    placeDetailsQuery.data.data
                                      .generativeSummary
                                  }
                                </p>
                              ) : (
                                <p className='text-sm text-muted-foreground'>
                                  No generative summary available
                                </p>
                              )}
                            </div>

                            {/* Reviews section */}
                            {placeDetailsQuery.data.data.reviews &&
                              placeDetailsQuery.data.data.reviews.length >
                                0 && (
                                <div className='p-3 border rounded-md bg-muted/30'>
                                  <p className='text-sm font-medium mb-3'>
                                    Reviews:
                                  </p>
                                  <div className='space-y-4'>
                                    {placeDetailsQuery.data.data.reviews.map(
                                      (review, index) => (
                                        <div
                                          key={index}
                                          className='p-3 border border-gray-200 dark:border-gray-700 rounded-md bg-muted/20'
                                        >
                                          <div className='flex items-center justify-between mb-2'>
                                            <div className='flex'>
                                              {[1, 2, 3, 4, 5].map((star) => (
                                                <span
                                                  key={`review-star-${index}-${star}`}
                                                  className={`text-xl ${
                                                    review.rating >= star
                                                      ? 'text-yellow-400'
                                                      : 'text-gray-300'
                                                  }`}
                                                >
                                                  ★
                                                </span>
                                              ))}
                                            </div>
                                          </div>
                                          <p className='text-xs text-muted-foreground mb-2'>
                                            {review.relativePublishTimeDescription ||
                                              'Unknown date'}
                                          </p>
                                          <p className='text-sm'>
                                            {review.text}
                                          </p>
                                        </div>
                                      )
                                    )}
                                  </div>
                                </div>
                              )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              !placeDetailsQuery.isError && (
                <div className='flex flex-col items-center justify-center h-64 text-center'>
                  <p className='text-muted-foreground'>
                    Enter a place ID and click &quot;Get Details&quot; to see
                    results
                  </p>
                </div>
              )
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

const ErrorFallback = () => {
  return (
    <div className='flex flex-col items-center justify-center h-64 text-center'>
      <p className='text-muted-foreground'>Error fetching place details ‼️</p>
      <Button
        onClick={() => {
          window.location.reload();
        }}
      >
        Try again
      </Button>
    </div>
  );
};

// Main page component
export default function PlacesDetailsPage() {
  return (
    <div className='flex flex-col gap-8 p-4'>
      {/* Title + Description */}
      <div>
        <h1 className='text-2xl font-bold'>Place Details</h1>
        <p className='text-sm text-muted-foreground'>
          Get detailed information about a specific place using its Place ID.
        </p>
      </div>

      <ErrorBoundary fallbackUI={<ErrorFallback />}>
        <Suspense fallback={<PlaceDetailsSkeleton />}>
          <DetailsForm />
        </Suspense>
      </ErrorBoundary>
    </div>
  );
}
