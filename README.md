# Emoji Map Web App

A Next.js web application that displays places on a map using emoji markers, similar to the iOS app. This web app uses the Google Places API to fetch location data and display it on an interactive map.

## Features

- 🗺️ Interactive Google Maps integration
- 🍔 Category-based place search with emoji markers
- 🔍 Search for places near your current location
- ⭐ View place details including ratings, photos, and reviews
- 🌙 Dark mode support
- 📱 Responsive design for mobile and desktop
- 📚 Interactive API documentation with Swagger UI

## Tech Stack

- [Next.js 15](https://nextjs.org/) - React framework
- [TypeScript](https://www.typescriptlang.org/) - Type safety
- [Google Maps API](https://developers.google.com/maps) - Maps and location services
- [Google Places API](https://developers.google.com/maps/documentation/places/web-service) - Place data
- [Tailwind CSS](https://tailwindcss.com/) - Styling
- [@t3-oss/env-nextjs](https://github.com/t3-oss/env-nextjs) - Type-safe environment variables
- [next-swagger-doc](https://github.com/atomicpages/next-swagger-doc) - OpenAPI documentation
- [Swagger UI](https://swagger.io/tools/swagger-ui/) - Interactive API documentation

## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Google Maps API key with Places API enabled

### Environment Variables

Create a `.env.local` file in the root of the web directory with the following variables:

```
# Google Places API Key (for client-side use)
NEXT_PUBLIC_GOOGLE_PLACES_API_KEY=your_api_key_here

# Google Places API Key (for server-side use)
GOOGLE_PLACES_API_KEY=your_api_key_here

# Google Places API URLs
GOOGLE_PLACES_URL=https://maps.googleapis.com/maps/api/place/nearbysearch/json
GOOGLE_PLACES_DETAILS_URL=https://maps.googleapis.com/maps/api/place/details/json
GOOGLE_PLACES_PHOTO_URL=https://maps.googleapis.com/maps/api/place/photo
```

> **Note:** The application uses type-safe environment variables with `@t3-oss/env-nextjs`. If any required environment variables are missing, the build will fail with a clear error message.

### Installation

```bash
# Install dependencies
pnpm install

# Run the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## API Documentation

The API is documented using OpenAPI (Swagger) specification. You can access the interactive API documentation at:

```
http://localhost:3000/api-docs
```

This documentation provides:

- Detailed information about all available endpoints
- Request parameters and their types
- Response schemas
- Example requests and responses
- Interactive "Try it out" functionality to test the API directly from the browser

The API specification is also available in JSON format at:

```
http://localhost:3000/api/docs
```

This can be imported into API client tools like Postman or used by other applications to generate client code.

## API Routes

### `/api/places/nearby`

Fetches nearby places based on location and category.

**Parameters:**

- `location` (required): Latitude and longitude in format "lat,lng"
- `radius` (optional): Search radius in meters (default: 5000)
- `type` (required): Google Places type (e.g., "restaurant", "cafe")
- `keyword` (optional): Specific keyword to search for
- `category` (optional): Category name to assign to results
- `openNow` (optional): Set to "true" to only show places that are currently open

**Example:**

```
/api/places/nearby?location=37.7749,-122.4194&radius=5000&type=restaurant&keyword=burger&category=burger&openNow=true
```

### `/api/places/details`

Fetches details for a specific place.

**Parameters:**

- `placeId` (required): The Google Places ID of the place

**Example:**

```
/api/places/details?placeId=ChIJN1t_tDeuEmsRUsoyG83frY4
```

## Project Structure

```
web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── docs/
│   │   │   │   └── route.ts
│   │   │   ├── places/
│   │   │   │   ├── nearby/
│   │   │   │   │   └── route.ts
│   │   │   │   └── details/
│   │   │   │       └── route.ts
│   │   ├── api-docs/
│   │   │   └── page.tsx
│   │   ├── components/
│   │   │   └── PlacesSearch.tsx
│   │   ├── utils/
│   │   │   └── googlePlacesService.ts
│   │   ├── globals.css
│   │   ├── layout.tsx
│   │   └── page.tsx
│   ├── lib/
│   │   └── swagger.ts
│   ├── types/
│   │   ├── google-places.ts
│   │   └── swagger-ui-react.d.ts
│   └── env.ts
├── public/
├── .env.local
├── next.config.ts
└── package.json
```

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- Emoji Map iOS app for the original concept
- Google Maps and Places API for location data
- Next.js team for the amazing framework
