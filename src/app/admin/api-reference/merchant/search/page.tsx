'use client';

import { useState } from 'react';
import { InfoIcon } from 'lucide-react';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useMerchantSearchMutation } from '@/hooks';

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

export default function MerchantSearchApiReferencePage() {
  const { mutate, data, isPending, error } = useMerchantSearchMutation();
  const [searchParams, setSearchParams] = useState({
    name: '',
    city: '',
    state: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutate(searchParams);
  };

  return (
    <ErrorBoundary fallbackUI={<ErrorFallback />}>
      <div className='flex flex-col gap-8 p-4'>
        {/* Title + Description */}
        <div>
          <h1 className='text-2xl font-bold'>Merchant Business Search</h1>
          <p className='text-sm text-muted-foreground'>
            Search for restaurants using the Google Places API to find
            businesses that merchants can claim.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Authentication</CardTitle>
            <CardDescription>
              This endpoint requires authentication via Clerk. The user must be
              logged in to access this endpoint.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='flex items-center gap-2'>
              <Badge variant='outline'>Authorization</Badge>
              <span>Required</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Request Body</CardTitle>
            <CardDescription>
              The endpoint accepts a JSON object with the following properties.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <pre className='p-4 bg-muted rounded-lg overflow-auto'>
              {`{
  "name": string,    // Restaurant name
  "city": string,    // City location
  "state": string    // State location
}`}
            </pre>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Response</CardTitle>
            <CardDescription>
              The endpoint returns search results or an error response.
            </CardDescription>
          </CardHeader>
          <CardContent className='space-y-4'>
            <div className='space-y-2'>
              <div className='flex items-center gap-2'>
                <Badge className='bg-green-500 text-white'>200 OK</Badge>
                <h3 className='font-semibold'>Success Response</h3>
              </div>
              <pre className='p-4 bg-muted rounded-lg overflow-auto'>
                {`{
  "data": [{
    "id": string,
    "formattedAddress": string,
    "nationalPhoneNumber": string,
    "displayName": string
  }],
  "count": number
}`}
              </pre>
            </div>

            <div className='space-y-2'>
              <h3 className='font-semibold'>Error Responses</h3>
              <div className='space-y-2'>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-red-500 text-white'>400</Badge>
                  <span>
                    Invalid data - Missing or invalid request parameters
                  </span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-red-500 text-white'>401</Badge>
                  <span>Unauthorized - User is not authenticated</span>
                </div>
                <div className='flex items-center gap-2'>
                  <Badge className='bg-red-500 text-white'>500</Badge>
                  <span>
                    Internal Server Error - Server-side error occurred
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Live Test</CardTitle>
            <CardDescription>
              Test the search endpoint with your current authentication.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className='space-y-6'>
              <div className='grid gap-4'>
                <div className='space-y-2'>
                  <Label htmlFor='name'>Restaurant Name</Label>
                  <Input
                    id='name'
                    placeholder="e.g., McDonald's"
                    value={searchParams.name}
                    onChange={(e) =>
                      setSearchParams((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='city'>City</Label>
                  <Input
                    id='city'
                    placeholder='e.g., San Francisco'
                    value={searchParams.city}
                    onChange={(e) =>
                      setSearchParams((prev) => ({
                        ...prev,
                        city: e.target.value,
                      }))
                    }
                  />
                </div>
                <div className='space-y-2'>
                  <Label htmlFor='state'>State</Label>
                  <Input
                    id='state'
                    placeholder='e.g., CA'
                    value={searchParams.state}
                    onChange={(e) =>
                      setSearchParams((prev) => ({
                        ...prev,
                        state: e.target.value,
                      }))
                    }
                  />
                </div>
              </div>
              <Button type='submit' disabled={isPending}>
                {isPending ? 'Searching...' : 'Search'}
              </Button>
            </form>

            {error && (
              <Alert variant='destructive' className='mt-4'>
                <InfoIcon className='h-4 w-4' />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error.message}</AlertDescription>
              </Alert>
            )}

            {data && (
              <div className='mt-6 space-y-4'>
                <h3 className='font-semibold'>
                  Search Results ({data.count} found)
                </h3>
                <pre className='p-4 bg-muted rounded-lg overflow-auto'>
                  {JSON.stringify(data, null, 2)}
                </pre>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ErrorBoundary>
  );
}
