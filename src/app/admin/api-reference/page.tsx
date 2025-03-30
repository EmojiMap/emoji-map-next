import Link from 'next/link';

export default function ApiReferencesPage() {
  return (
    <div className='flex flex-1 flex-col gap-6 p-4'>
      <h1 className='text-3xl font-bold'>API References</h1>
      <p className='text-muted-foreground'>
        Overview of available API endpoints. Click on a category to see detailed
        documentation for each route.
      </p>

      <div className='grid gap-6 md:grid-cols-3'>
        {/* User API */}
        <ApiSection
          title='User API'
          description='Endpoints for user management and authentication'
          endpoints={[
            {
              name: '/api/user',
              description: 'Get or Update user profile information',
              methods: ['GET', 'DELETE', 'PATCH'],
            },
            {
              name: '/api/user/sync',
              description: 'Sync user data',
              methods: ['POST'],
            },
          ]}
          link='/admin/api-reference/user'
        />

        {/* Places API */}
        <ApiSection
          title='Places API'
          description='Search, manage and interact with places'
          endpoints={[
            {
              name: '/api/places/search',
              description: 'Search for places',
              methods: ['GET'],
            },
            {
              name: '/api/places/details',
              description: 'Get place details',
              methods: ['GET'],
            },
            {
              name: '/api/places/favorite',
              description: 'Manage favorite places',
              methods: ['GET', 'POST'],
            },
            {
              name: '/api/places/rating',
              description: 'Rate places',
              methods: ['POST'],
            },
            {
              name: '/api/places/photos',
              description: 'Place photos',
              methods: ['GET'],
            },
          ]}
          link='/admin/api-reference/places'
        />

        {/* Merchant API */}
        <ApiSection
          title='Merchant API'
          description='Endpoints for merchant management and operations'
          endpoints={[
            {
              name: '/api/merchant',
              description: 'Merchant profile and settings',
              methods: ['GET'],
            },
            {
              name: '/api/merchant/associate',
              description: 'Associate a merchant with a place',
              methods: ['POST'],
            },
          ]}
          link='/admin/api-reference/merchant'
        />

        {/* Inngest API */}
        <ApiSection
          title='Inngest API'
          description='Background job and event processing'
          endpoints={[
            {
              name: '/api/inngest',
              description: 'Handle background jobs and events',
              methods: ['GET', 'POST', 'PUT'],
            },
          ]}
          link='/admin/api-reference/inngest'
        />

        {/* Admin API */}
        <ApiSection
          title='Admin API'
          description='Endpoints used for this admin dashboard'
          endpoints={[
            {
              name: '/api/admin/app-store-connect',
              description: 'Get App Store Connect Downloads and Trends',
              methods: ['GET'],
            },
            {
              name: '/api/admin/clerk-users',
              description: 'Get Clerk user accounts and authentication',
              methods: ['GET'],
            },
            {
              name: '/api/admin/clerk-users/toggle-admin-status',
              description: 'Toggle admin status for a user',
              methods: ['POST'],
            },
            {
              name: '/api/admin/db-users',
              description: 'Get database user records and metadata',
              methods: ['GET'],
            },
            {
              name: '/api/admin/user-favorites',
              description: 'Get user favorite places',
              methods: ['GET'],
            },
            {
              name: '/api/admin/user-ratings',
              description: 'Get user place ratings',
              methods: ['GET'],
            },
          ]}
          link='/admin/api-reference/admin'
        />

        {/* Support API */}
        <ApiSection
          title='Support API'
          description='Customer support and help desk functionality'
          endpoints={[
            {
              name: '/api/support',
              description: 'Contact form submissions',
              methods: ['POST'],
            },
          ]}
          link='/admin/api-reference/support'
        />

        {/* Webhooks API */}
        <ApiSection
          title='Webhooks API'
          description='Handle external service webhooks'
          endpoints={[
            {
              name: '/api/webhooks',
              description: 'Process webhook events',
              methods: ['POST'],
            },
          ]}
          link='/admin/api-reference/webhooks'
        />

        {/* Health API */}
        <ApiSection
          title='Health API'
          description='System health and monitoring'
          endpoints={[
            {
              name: '/api/health',
              description: 'Check system health status',
              methods: ['GET'],
            },
          ]}
          link='/admin/api-reference/health'
        />

        {/* Debug API */}
        <ApiSection
          title='Debug API'
          description='Debugging tools and utilities'
          endpoints={[
            {
              name: '/api/debug/categories',
              description: 'Debug category information',
              methods: ['GET'],
            },
          ]}
          link='/admin/api-reference/debug'
        />

        {/* Test Logger API */}
        <ApiSection
          title='Test Logger API'
          description='Testing and logging functionality'
          endpoints={[
            {
              name: '/api/test-logger',
              description: 'Log test events and data',
              methods: ['POST'],
            },
          ]}
          link='/admin/api-reference/test-logger'
        />
      </div>

      <div className='mt-8 rounded-xl border p-6 bg-white/90 dark:bg-card/80 backdrop-blur-md text-card-foreground shadow-lg border-purple-200 dark:border-white/10 z-10'>
        <h2 className='text-xl font-semibold mb-4'>API Authentication</h2>
        <p className='mb-2'>
          Most API endpoints require authentication. Use one of the following
          methods:
        </p>
        <ul className='list-disc list-inside space-y-2 ml-4'>
          <li>Session-based authentication (for browser clients)</li>
          <li>
            API key authentication via <code>x-api-key</code> header (for
            server-to-server)
          </li>
          <li>
            OAuth2 token via <code>Authorization: Bearer {'{token}'}</code>{' '}
            header
          </li>
        </ul>
        <div className='mt-6 bg-muted p-4 rounded'>
          <p className='text-sm font-medium'>Need help with our API?</p>
          <p className='text-sm text-muted-foreground'>
            Contact the development team for API integration support or feature
            requests.
          </p>
        </div>
      </div>
    </div>
  );
}

// API documentation section component
interface ApiEndpoint {
  name: string;
  description: string;
  methods: ('GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH')[];
}

interface ApiSectionProps {
  title: string;
  description: string;
  endpoints: ApiEndpoint[];
  link: string;
}

function MethodBadge({ method }: { method: string }) {
  const colors = {
    GET: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    POST: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    PUT: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    PATCH:
      'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  }[method];

  return (
    <span
      className={`inline-flex items-center rounded-md px-2 py-1 text-xs font-medium ${colors} mr-2`}
    >
      {method}
    </span>
  );
}

function ApiSection({ title, description, endpoints, link }: ApiSectionProps) {
  return (
    <div className='rounded-xl border overflow-hidden bg-white/90 dark:bg-card/80 backdrop-blur-md text-card-foreground shadow-lg border-purple-200 dark:border-white/10 p-6 z-10'>
      <div className='bg-muted/50 p-4'>
        <h2 className='text-xl font-semibold'>{title}</h2>
        <p className='text-sm text-muted-foreground'>{description}</p>
      </div>
      <div className='p-4'>
        <ul className='space-y-4'>
          {endpoints.map((endpoint) => (
            <li key={endpoint.name} className='text-sm'>
              <div className='flex flex-wrap items-center gap-2 mb-1.5'>
                {endpoint.methods.map((method) => (
                  <MethodBadge
                    key={`${endpoint.name}-${method}`}
                    method={method}
                  />
                ))}
                <span className='font-mono text-xs bg-muted px-1.5 py-0.5 rounded'>
                  {endpoint.name}
                </span>
              </div>
              <span className='block text-muted-foreground pl-1'>
                {endpoint.description}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href={link}
          className='mt-6 inline-block text-sm font-medium text-primary hover:underline'
        >
          View detailed documentation →
        </Link>
      </div>
    </div>
  );
}
