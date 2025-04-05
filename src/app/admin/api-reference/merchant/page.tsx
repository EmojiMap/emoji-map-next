'use client';

import { useState } from 'react';
import { InfoIcon } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useMerchantQuery } from '@/hooks';

// Skeleton component for API response
const ResponseSkeleton = () => {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Skeleton className='h-8 w-72' /> {/* Title skeleton */}
        <div className='p-3 border rounded-md bg-muted'>
          {[1, 2, 3].map((item) => (
            <div key={item} className='flex justify-between items-center mb-2'>
              <Skeleton className='h-5 w-40' /> {/* Label skeleton */}
              <Skeleton className='h-5 w-60' /> {/* Value skeleton */}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function ErrorFallback() {
  return (
    <Alert variant='destructive'>
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        An error occurred while fetching merchant data. Please try again later.
      </AlertDescription>
    </Alert>
  );
}

export default function MerchantApiReferencePage() {
  const { data, isLoading, error } = useMerchantQuery();
  const [showRawJson, setShowRawJson] = useState(false);

  // Helper function to render a detail field
  const renderDetailField = (label: string, value: unknown) => {
    if (value === undefined || value === null) return null;

    return (
      <div
        className='flex justify-between items-start py-2 border-b border-gray-200 dark:border-gray-700 last:border-b-0'
        key={label}
      >
        <span className='font-medium'>{label}:</span>
        <span className='text-right max-w-[60%]'>{String(value)}</span>
      </div>
    );
  };

  return (
    <ErrorBoundary fallbackUI={<ErrorFallback />}>
      <div className='flex flex-col gap-8 p-4'>
        {/* Title + Description */}
        <div>
          <h1 className='text-2xl font-bold'>Merchant API</h1>
          <p className='text-sm text-muted-foreground'>
            Retrieve merchant information for the currently authenticated user.
          </p>
        </div>

        <Card>
          <CardHeader>
            <div className='flex items-center gap-2'>
              <Badge>GET</Badge>
              <code className='bg-muted px-2 py-1 rounded text-sm'>
                /api/merchant
              </code>
            </div>
            <CardTitle className='mt-2'>Endpoint Details</CardTitle>
            <CardDescription>
              Retrieves merchant information including places, photos, ratings,
              and reviews.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div>
              <h3 className='text-sm font-medium mb-2'>Authentication</h3>
              <div className='flex items-center gap-2'>
                <Badge variant='destructive'>Required</Badge>
                <span className='text-sm'>
                  Bearer token from Clerk authentication
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response Format</CardTitle>
            <CardDescription>
              The endpoint returns merchant data or an error response.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-4'>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-green-500 text-white'>200 OK</Badge>
                  <h3 className='font-semibold'>Success Response</h3>
                </div>
                <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
                  {`{
  "merchant": {
    "id": string,
    "userId": string,
    "user": {
      "id": string,
      "name": string,
      // other user fields
    },
    "places": [{
      "id": string,
      "name": string,
      "photos": [...],
      "ratings": [...],
      "reviews": [...]
    }]
  }
}`}
                </pre>
              </div>

              <div className='space-y-2'>
                <h3 className='text-sm font-medium'>Error Responses</h3>
                <div className='space-y-2'>
                  <div className='flex items-center gap-2'>
                    <Badge className='bg-red-500 text-white'>401</Badge>
                    <span className='text-sm'>
                      Unauthorized - User is not authenticated
                    </span>
                  </div>
                  <div className='flex items-center gap-2'>
                    <Badge className='bg-red-500 text-white'>500</Badge>
                    <span className='text-sm'>
                      Internal Server Error - Server-side error occurred
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className='flex justify-between items-center'>
              <div className='space-y-1.5'>
                <CardTitle>Live Test Results</CardTitle>
                <CardDescription>
                  Results from querying the endpoint with your current
                  authentication.
                </CardDescription>
              </div>
              <div className='flex items-center space-x-2'>
                <Checkbox
                  id='showRawJson'
                  checked={showRawJson}
                  onCheckedChange={(checked) => setShowRawJson(!!checked)}
                />
                <label
                  htmlFor='showRawJson'
                  className='text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70'
                >
                  Show Raw JSON
                </label>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <ResponseSkeleton />
            ) : error ? (
              <Alert variant='destructive'>
                <InfoIcon className='h-4 w-4' />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : data ? (
              <div className='min-h-[250px]'>
                {showRawJson ? (
                  <div className='relative h-[250px] overflow-hidden'>
                    <div className='absolute inset-0 overflow-auto bg-muted p-4 rounded-md'>
                      <pre className='text-xs'>
                        {JSON.stringify(data, null, 2)}
                      </pre>
                    </div>
                  </div>
                ) : (
                  <div className='relative h-[250px] overflow-hidden'>
                    <div className='absolute inset-0 overflow-auto pr-1 border border-muted rounded-md'>
                      <div className='space-y-4 p-4'>
                        <div className='p-3 border rounded-md bg-muted/30'>
                          {renderDetailField('Merchant ID', data.merchant?.id)}
                          {renderDetailField('User ID', data.merchant?.userId)}
                          {renderDetailField('Places Count', data.merchant?.places?.length || 0)}
                        </div>
                        {data.merchant?.places?.map((place) => (
                          <div
                            key={place.id}
                            className='p-3 border rounded-md bg-muted/30'
                          >
                            <h3 className='text-lg font-semibold mb-3'>
                              {place.name || 'Name not available'}
                            </h3>
                            <Separator className='my-4' />
                            <div className='space-y-1'>
                              {renderDetailField('ID', place.id)}
                              {renderDetailField('Address', place.address)}
                              {renderDetailField('Allows Dogs', place.allowsDogs ? 'Yes' : 'No')}
                              {renderDetailField('Delivery', place.delivery ? 'Yes' : 'No')}
                              {renderDetailField('Rating Count', place.userRatingCount)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ) : null}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
