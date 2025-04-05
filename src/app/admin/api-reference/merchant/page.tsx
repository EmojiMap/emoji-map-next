'use client';

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
import { useMerchantQuery } from '@/hooks';

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

  return (
    <ErrorBoundary fallbackUI={<ErrorFallback />}>
      <div className='container max-w-4xl py-6 space-y-6'>
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
            <CardTitle>Live Test Results</CardTitle>
            <CardDescription>
              Results from querying the endpoint with your current
              authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className='text-muted-foreground text-sm'>Loading...</div>
            ) : error ? (
              <Alert variant='destructive'>
                <InfoIcon className='h-4 w-4' />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            ) : (
              <pre className='bg-muted p-4 rounded-lg overflow-x-auto text-sm'>
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
