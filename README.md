# Emoji Map Web App

<div align="center">
  <p align="center">
    <img src="public/logo-blur.png" alt="Emoji Map Logo" width="180" height="180" style="border-radius: 12px; margin: 0 auto 20px; display: block; box-shadow: 0 4px 8px rgba(0,0,0,0.1);" />
  </p>
  <h3 align="center" style="margin-bottom: 20px;">Find places on a map with emoji markers</h3>
  
  <div style="margin-top: 20px;">
    <a href="https://github.com/sotomaque/emoji-map-next" style="margin: 0 10px;">
      <img src="https://img.shields.io/badge/GitHub-Web_App-blue?style=for-the-badge&logo=github" alt="Web App Repository" />
    </a>
    <a href="https://github.com/sotomaque/emoji-map" style="margin: 0 10px;">
      <img src="https://img.shields.io/badge/GitHub-iOS_App-purple?style=for-the-badge&logo=github" alt="iOS App Repository" />
    </a>
  </div>
</div>

A Next.js web application that displays places on a map using emoji markers. This web app is the companion to the [iOS Emoji Map app](https://github.com/sotomaque/emoji-map), providing the same functionality in a web interface. Both applications connect to our Next.js backend, which interfaces with the Google Places API and provides data through a shared services layer.

## Features

- 🗺️ Interactive Google Maps integration with custom emoji markers
- 🍔 Category-based place search with emoji markers
- 🔍 Search for places near your current location
- ⭐ View place details including ratings, photos, and reviews
- 🌙 Dark mode support
- 📱 Responsive design for mobile and desktop
- 📄 Simple API documentation
- 🔄 State management with Zustand for filters and preferences
- 📊 Marker clustering for improved map performance
- 🧪 Comprehensive test suite with 95%+ coverage
- 🚀 Redis caching for improved API performance
- 🔐 User authentication with Clerk
- 🗄️ PostgreSQL database with Prisma ORM
- 🔄 Git hooks with Husky for code quality checks

### Data Flow

1. **User Interaction**: User interacts with the frontend to search for places or manage their account
2. **Authentication**:
   - User authenticates directly with Clerk from the frontend
   - Clerk provides authentication tokens to the frontend
3. **API Requests**:
   - Frontend makes requests to the Next.js backend API
   - Backend validates authentication with Clerk
4. **Places Data Flow**:
   - Place-related requests go to the `/api/places` routes
   - These routes check Redis cache for existing data
   - If data is not in cache, Redis fetches from Google Places API
   - Responses are cached in Redis for future requests
   - Data is returned to the frontend for display
5. **User Data Flow**:
   - User data is stored in Supabase PostgreSQL
   - When user data changes, Clerk sends webhook events to the backend
   - Backend processes webhook events and updates Supabase via Prisma

## Tech Stack

- [Next.js 15.2.1](https://nextjs.org/) - React framework
- [React 19.0.0](https://react.dev/) - UI library
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Google Maps API](https://developers.google.com/maps) - Maps and location services
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) - Place data
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [Zustand](https://github.com/pmndrs/zustand) - State management
- [@react-google-maps/api](https://github.com/JustFly1984/react-google-maps-api) - Google Maps React components
- [@t3-oss/env-nextjs](https://github.com/t3-oss/env-nextjs) - Type-safe environment variables
- [Vitest](https://vitest.dev/) - Testing framework
- [MSW](https://mswjs.io/) - API mocking for tests
- [React Query](https://tanstack.com/query/latest) - Data fetching and caching
- [Upstash Redis](https://upstash.com/) - Serverless Redis for caching
- [Supabase](https://supabase.com/) - PostgreSQL database
- [Prisma](https://www.prisma.io/) - ORM for database access
- [Clerk](https://clerk.com/) - User authentication
- [Husky](https://typicode.github.io/husky/) - Git hooks for code quality

## Getting Started

### Environment Variables

Create a `.env.local` file in the root of the web directory with the following variables:

```
# Site Environment
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_ENV=development

# Google Places API
GOOGLE_PLACES_API_KEY=your_api_key_here
GOOGLE_PLACES_URL=https://places.googleapis.com/v1

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_SIGNING_SECRET=your_clerk_signing_secret
CLERK_ORG_ID=your_clerk_org_id

# Database - Supabase
POSTGRES_URL=your_postgres_url
POSTGRES_PRISMA_URL=your_postgres_prisma_url
SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
POSTGRES_URL_NON_POOLING=your_postgres_url_non_pooling
SUPABASE_JWT_SECRET=your_supabase_jwt_secret
POSTGRES_USER=your_postgres_user
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
POSTGRES_PASSWORD=your_postgres_password

# Upstash Redis (for caching)
KV_REST_API_TOKEN=your_upstash_redis_token
KV_REST_API_URL=your_upstash_redis_url

# Cache Keys 
SEARCH_CACHE_KEY_VERSION
DETAILS_CACHE_KEY_VERSION
PHOTOS_CACHE_KEY_VERSION

# APP STORE CONNECT
APP_STORE_CONNECT_BASE_URL=https://api.appstoreconnect.apple.com
APP_STORE_CONNECT_APP_SKU=your_app_store_connect_app_sku
APP_STORE_CONNECT_ISSUER_ID=your_app_store_connect_issuer_id
APP_STORE_CONNECT_KEY_ID=your_app_store_connect_key_id
APP_STORE_CONNECT_PRIVATE_KEY=your_app_store_connect_private_key
APP_STORE_CONNECT_VENDOR_NUMBER=your_app_store_connect_vendor_number

# RESEND
RESEND_API_KEY=your_resend_api_key
```

### Type-Safe Environment Variables

This project uses `@t3-oss/env-nextjs` for type-safe environment variables. Instead of directly accessing `process.env`, we use our custom environment helper located in `src/env.ts`:

```typescript
import { env } from '~/env';

// Type-safe access to environment variables
const apiKey = env.GOOGLE_PLACES_API_KEY;
```

This provides:

- Type safety for environment variables
- Runtime validation with Zod
- Better error messages when environment variables are missing
- Consistent access pattern across components

### Available Scripts

```bash
# Development
pnpm dev           # Start the development server
pnpm build         # Build the application for production
pnpm start         # Start the production server
pnpm postinstall   # Generate Prisma client (runs automatically after install)
pnpm prepare       # Set up Husky git hooks (runs automatically after install)
pnpm clean         # Clean build artifacts and node_modules cache

# Code Quality
pnpm lint          # Run ESLint to check for issues
pnpm lint:fix      # Run ESLint and automatically fix issues
pnpm format        # Run Prettier to format all files
pnpm format:check  # Check if files are properly formatted
pnpm precheck      # Run format, lint:fix, and type checking

# Testing
pnpm test          # Run all tests
pnpm test:watch    # Run tests in watch mode
pnpm test:ui       # Run tests with UI
pnpm test:coverage # Run tests with coverage report
pnpm test:silent   # Run tests with minimal output

# Database
pnpm db:generate   # Generate Prisma client
pnpm db:push       # Push schema changes to the database
pnpm db:studio     # Open Prisma Studio to manage the database
pnpm db:seed       # Seed the database with initial data

# Release Management
pnpm changeset           # Generate a changeset
pnpm changeset:create    # Create a changeset with guided CLI
pnpm changeset:version   # Bump versions based on changesets
```

## Git Hooks

This project uses Husky to manage Git hooks for ensuring code quality. The following hooks are configured:

### pre-push

The `pre-push` hook runs before pushing changes to the remote repository and performs the following checks:

1. **Precheck**: Runs formatting, linting, type checking, and tests to ensure code quality.
2. **Build**: Builds the project to ensure it compiles successfully.

If any of these checks fail, the push will be aborted, and you'll need to fix the issues before pushing again.

To bypass the hooks in rare cases (not recommended), you can use:

```bash
git push --no-verify
```

For more information about the Git hooks, see the [.husky/README.md](.husky/README.md) file.

## Deployment Process

This project follows a structured deployment process to ensure code quality and versioning:

1. **Development Workflow**:
   - All new features and bug fixes are implemented in feature branches
   - Pull requests are created against the `main` branch
   - Each PR must include appropriate changeset files documenting the changes
   - PRs are reviewed, tested, and merged into `main`

## Navigation System

The application uses a robust navigation system with active state detection for highlighting the current section in the navigation menu.

### Active State Detection

The navigation system includes a utility function `isNavItemActive` that determines whether a navigation item should be highlighted based on the current path:

```typescript
export function isNavItemActive(href: string, path: string | null | undefined) {
  // Handle null or undefined path
  if (!path) {
    return href === '/';
  }
  return href === '/' ? path === '/' : path.startsWith(href);
}
```

This function:

- Handles null or undefined paths by defaulting to the home page
- For the home page (`/`), only returns true if the path is exactly `/`
- For other pages, returns true if the current path starts with the navigation item's href

This approach ensures that navigation items are correctly highlighted even in nested routes and handles edge cases like null paths that might occur during hydration.

## API Documentation

API documentation is currently under development. A simple version of the API docs will be available at:

```
http://localhost:3000/api-docs
```

The documentation will provide details about available endpoints, request formats, and response structures.

## API Routes

### `/api/places/nearby`

Fetches nearby places based on location and category.

**Parameters:**

- `location` (required): Latitude and longitude in format "lat,lng"
- `radius` (optional): Search radius in meters (default: 5000)
- `bounds` (optional): Bounds in format "lat1,lng1|lat2,lng2"
- `type` (required): Google Places type (e.g., "restaurant", "cafe")
- `keywords` (optional): Comma-separated list of keywords to search for
- `openNow` (optional): Set to "true" to only show places that are currently open

**Example:**

```
/api/places/nearby?location=37.7749,-122.4194&radius=5000&type=restaurant&keywords=burger,pizza&openNow=true
```

**Backend Processing:**

1. The request is received by the Next.js API route
2. The route checks Redis for a cached response
3. If no cache exists, Redis makes a request to Google Places API
4. The response is cached in Redis for future requests
5. The data is returned to the client

**Caching:**

This endpoint implements Redis caching to improve performance and reduce API calls to Google Places:

- Results are cached based on location and radius
- Coordinates are rounded to 2 decimal places (~1.11km precision)
- Radius values are normalized to reduce unique cache keys
- Cache entries expire after 7 days

### `/api/places/details`

Fetches details for a specific place.

**Parameters:**

- `placeId` (required): The Google Places ID of the place

**Example:**

```
/api/places/details?placeId=ChIJN1t_tDeuEmsRUsoyG83frY4
```

**Caching:**

This endpoint implements Redis caching to improve performance and reduce API calls to Google Places:

- Results are cached based on placeId
- Cache entries expire after 1 hour
- The response includes a `source` field indicating whether the data came from the cache or the API

### `/api/webhooks`

Webhook endpoint for Clerk authentication events.

**Purpose:**

- Receives webhook events from Clerk when user data changes
- Synchronizes user data with the Supabase PostgreSQL database via Prisma
- Handles user creation, updates, and deletion events

**Flow:**

1. Clerk detects a change in user data (signup, profile update, deletion)
2. Clerk sends a webhook event to the `/api/webhooks` endpoint
3. The endpoint validates the webhook signature using Clerk's signing secret
4. The webhook payload is processed based on the event type
5. User data is synchronized with Supabase using Prisma ORM
6. A success response is returned to Clerk

**Security:**

- Validates webhook requests using Clerk's signing secret
- Rejects requests without valid Svix headers
- Uses environment variables for secure configuration

**Event Types:**

- `user.created`: A new user has signed up
- `user.updated`: A user has updated their profile
- `user.deleted`: A user has been deleted

**Example Webhook Processing:**

```typescript
// Simplified example of webhook processing
export async function POST(req: Request) {
  // Validate webhook signature
  const payload = await validateWebhookSignature(req);

  // Process based on event type
  switch (payload.type) {
    case 'user.created':
      await prisma.user.create({
        data: {
          id: payload.data.id,
          email: payload.data.email_addresses[0]?.email_address,
          name: payload.data.first_name,
        },
      });
      break;
    case 'user.updated':
      // Update user in database
      break;
    case 'user.deleted':
      // Delete user from database
      break;
  }

  return new Response('Webhook processed', { status: 200 });
}
```

## Event Processing with Inngest

The application uses Inngest for background job processing and event-driven operations. This allows us to handle time-consuming tasks asynchronously without blocking the main request-response cycle.

### Running Inngest Dev Server

To run the Inngest development server locally:

```bash
pnpm inngest
```

This will start the Inngest dev server, providing a local UI to monitor and debug events.

### Event Functions

The application defines several Inngest functions for background processing:


### Event Flow

1. **Event Triggering**: Events are sent to Inngest from various parts of the application:
   ```typescript
   await inngest.send({
     name: 'places/upsert-place',
     data: { id, details },
   });
   ```

2. **Event Processing**: Inngest functions process these events asynchronously:
   - Events are queued and processed in the background
   - Retries are handled automatically
   - Event processing status can be monitored

3. **Error Handling**: Inngest provides built-in error handling:
   - Automatic retries for failed events
   - Dead letter queues for unprocessable events
   - Error monitoring and alerting

### Benefits

- **Non-blocking Operations**: Long-running tasks don't block the main request thread
- **Reliability**: Automatic retries and error handling
- **Scalability**: Events are processed independently and can scale horizontally
- **Monitoring**: Built-in monitoring and debugging tools
- **Development Experience**: Local dev server for testing and debugging

## Database Integration

The web app uses Prisma ORM to interact with the Supabase PostgreSQL database. This provides:

1. **Type-safe database access**: Prisma generates TypeScript types based on your schema
2. **Simplified queries**: Prisma Client provides an intuitive API for database operations
3. **Migrations**: Prisma Migrate helps manage database schema changes
4. **Data validation**: Prisma validates data before sending it to the database

### Prisma Schema

The Prisma schema defines the database models and relationships:

```prisma
// Simplified example of Prisma schema
model User {
  id        String   @id
  email     String?  @unique
  name      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
  favorites Place[]
}

model Place {
  id        String   @id
  name      String
  location  Json
  category  String
  users     User[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

### Database Operations

The application uses Prisma Client for database operations:

```typescript
// Example of database operations with Prisma
import { prisma } from '~/lib/prisma';

// Create a user
const user = await prisma.user.create({
  data: {
    id: 'user_123',
    email: 'user@example.com',
    name: 'John Doe',
  },
});

// Add a favorite place for a user
await prisma.place.create({
  data: {
    id: 'place_123',
    name: 'Coffee Shop',
    location: { lat: 37.7749, lng: -122.4194 },
    category: 'cafe',
    users: {
      connect: { id: 'user_123' },
    },
  },
});

// Get a user with their favorite places
const userWithFavorites = await prisma.user.findUnique({
  where: { id: 'user_123' },
  include: { favorites: true },
});
```
