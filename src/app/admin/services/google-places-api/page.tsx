import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ExternalLink,
  FileCode,
  FileText,
  GanttChart,
  Globe,
  LayoutDashboard,
  Settings,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  GOOGLE_PLACES_API_DOCS,
  GOOGLE_PLACES_API_PLACE_TYPES,
  GOOGLE_PLACES_API_TEXT_SEARCH,
  GOOGLE_PLACES_API_PLACE_DETAILS,
  GOOGLE_PLACES_API_PLACE_PHOTOS,
} from '@/constants/links';
import { SERVICES } from '@/constants/services';

export default function GooglePlacesApiPage() {
  const googlePlacesApiData = SERVICES.find(
    (s) => s.href === '/admin/services/google-places-api'
  );

  if (!googlePlacesApiData) {
    notFound();
  }

  const foodRelatedTypes = [
    'acai_shop *',
    'afghani_restaurant *',
    'african_restaurant *',
    'american_restaurant',
    'asian_restaurant *',
    'bagel_shop *',
    'bakery',
    'bar',
    'bar_and_grill *',
    'barbecue_restaurant',
    'brazilian_restaurant',
    'breakfast_restaurant',
    'brunch_restaurant',
    'buffet_restaurant *',
    'cafe',
    'cafeteria *',
    'candy_store *',
    'cat_cafe *',
    'chinese_restaurant',
    'chocolate_factory *',
    'chocolate_shop *',
    'coffee_shop',
    'confectionery *',
    'deli *',
    'dessert_restaurant *',
    'dessert_shop *',
    'diner *',
    'dog_cafe *',
    'donut_shop *',
    'fast_food_restaurant',
    'fine_dining_restaurant *',
    'food_court *',
    'french_restaurant',
    'greek_restaurant',
    'hamburger_restaurant',
    'ice_cream_shop',
    'indian_restaurant',
    'indonesian_restaurant',
    'italian_restaurant',
    'japanese_restaurant',
    'juice_shop *',
    'korean_restaurant *',
    'lebanese_restaurant',
    'meal_delivery',
    'meal_takeaway',
    'mediterranean_restaurant',
    'mexican_restaurant',
    'middle_eastern_restaurant',
    'pizza_restaurant',
    'pub *',
    'ramen_restaurant',
    'restaurant',
    'sandwich_shop',
    'seafood_restaurant',
    'spanish_restaurant',
    'steak_house',
    'sushi_restaurant',
    'tea_house *',
    'thai_restaurant',
    'turkish_restaurant',
    'vegan_restaurant',
    'vegetarian_restaurant',
    'vietnamese_restaurant',
    'wine_bar *',
  ];

  const nearbySearchFields = [
    'places.name',
    'places.id',
    'places.types',
    'places.location',
    'places.currentOpeningHours.openNow',
    'places.priceLevel',
    'places.rating',
    'places.displayName.text',
  ];

  const merchantSearchFields = [
    'places.id',
    'places.formattedAddress',
    'places.nationalPhoneNumber',
    'places.displayName.text',
  ];

  return (
    <div className='flex flex-1 flex-col gap-6 p-6'>
      <div className='flex justify-between items-start mb-8'>
        <div className='space-y-2'>
          <h1 className='text-3xl font-bold tracking-tight'>
            {googlePlacesApiData.title}
          </h1>
          <p className='text-muted-foreground max-w-3xl'>
            EmojiMap uses {googlePlacesApiData.title} for{' '}
            {googlePlacesApiData.description.toLowerCase()}.
          </p>
        </div>
        <div className='flex items-center gap-4'>
          <Image
            src={googlePlacesApiData.logoUrl!}
            alt={`${googlePlacesApiData.title} Logo`}
            width={48}
            height={48}
            className={googlePlacesApiData.darkInvert ? 'dark:invert' : ''}
          />
          <Button asChild>
            <Link
              href={GOOGLE_PLACES_API_DOCS}
              target='_blank'
              rel='noopener noreferrer'
            >
              View Documentation
            </Link>
          </Button>
        </div>
      </div>

      {/* API Documentation */}
      <div className='grid grid-cols-1 lg:grid-cols-2 gap-6'>
        <Card className='p-6'>
          <h2 className='text-2xl font-semibold mb-4'>Core API Endpoints</h2>
          <div className='space-y-6'>
            <div>
              <h3 className='text-xl font-medium mb-2'>1. Nearby Search</h3>
              <p className='text-muted-foreground mb-2'>
                Primary endpoint for querying places on the map. We use the
                Places API (New) version with <code>includedTypes</code> to
                filter for food-related establishments.
              </p>
              <div className='bg-muted p-4 rounded-md mb-2'>
                <h4 className='font-medium mb-2'>Requested Fields:</h4>
                <ul className='list-none space-y-1'>
                  {nearbySearchFields.map((field) => (
                    <li key={field} className='font-mono text-sm'>
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
              <div className='mt-4'>
                <Link
                  href={GOOGLE_PLACES_API_PLACE_TYPES}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  View All Supported Place Types →
                </Link>
              </div>
            </div>

            <div>
              <h3 className='text-xl font-medium mb-2'>2. Text Search</h3>
              <p className='text-muted-foreground mb-2'>
                Used in <code>/api/merchant/search</code> for merchant-specific
                searches.
              </p>
              <div className='bg-muted p-4 rounded-md mb-2'>
                <h4 className='font-medium mb-2'>Requested Fields:</h4>
                <ul className='list-none space-y-1'>
                  {merchantSearchFields.map((field) => (
                    <li key={field} className='font-mono text-sm'>
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
              <div className='mt-2'>
                <Link
                  href={GOOGLE_PLACES_API_TEXT_SEARCH}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  Learn more about Text Search →
                </Link>
              </div>
            </div>

            <div>
              <h3 className='text-xl font-medium mb-2'>3. Place Details</h3>
              <p className='text-muted-foreground mb-2'>
                Used in <code>/api/places/details</code> to fetch comprehensive
                place information.
              </p>
              <div className='bg-muted p-4 rounded-md mb-2'>
                <h4 className='font-medium mb-2'>Requested Fields:</h4>
                <ul className='list-none space-y-1'>
                  {[
                    'name',
                    'rating',
                    'reviews',
                    'priceLevel',
                    'userRatingCount',
                    'currentOpeningHours.openNow',
                    'primaryTypeDisplayName.text',
                    'displayName.text',
                    'takeout',
                    'delivery',
                    'dineIn',
                    'editorialSummary.text',
                    'outdoorSeating',
                    'liveMusic',
                    'menuForChildren',
                    'servesDessert',
                    'servesCoffee',
                    'goodForChildren',
                    'goodForGroups',
                    'allowsDogs',
                    'restroom',
                    'paymentOptions',
                    'generativeSummary.overview.text',
                    'location',
                    'formattedAddress',
                  ].map((field) => (
                    <li key={field} className='font-mono text-sm'>
                      {field}
                    </li>
                  ))}
                </ul>
              </div>
              <div className='mt-2'>
                <Link
                  href={GOOGLE_PLACES_API_PLACE_DETAILS}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  Learn more about Place Details →
                </Link>
              </div>
            </div>

            <div>
              <h3 className='text-xl font-medium mb-2'>4. Place Photos</h3>
              <p className='text-muted-foreground mb-2'>
                Used in <code>/api/places/photos</code> to retrieve place
                photos. The process is two-step:
              </p>
              <div className='bg-muted p-4 rounded-md mb-2'>
                <h4 className='font-medium mb-2'>Process:</h4>
                <ol className='list-decimal list-inside space-y-2'>
                  <li>
                    <span className='font-medium'>Fetch Photo Metadata:</span>
                    <br />
                    <span className='text-sm'>
                      First retrieves photo IDs using the <code>photos</code>{' '}
                      field
                    </span>
                  </li>
                  <li>
                    <span className='font-medium'>Fetch Photos:</span>
                    <br />
                    <span className='text-sm'>
                      Then fetches actual photo URLs using the obtained photo
                      IDs
                    </span>
                  </li>
                </ol>
              </div>
              <div className='mt-2'>
                <Link
                  href={GOOGLE_PLACES_API_PLACE_PHOTOS}
                  target='_blank'
                  rel='noopener noreferrer'
                  className='text-primary hover:underline'
                >
                  Learn more about Place Photos →
                </Link>
              </div>
            </div>
          </div>
        </Card>

        <Card className='p-6'>
          <h2 className='text-2xl font-semibold mb-4'>Supported Place Types</h2>
          <p className='text-muted-foreground mb-4'>
            We support a comprehensive list of food-related place types. Types
            marked with an asterisk (*) were added in a recent update.
          </p>
          <div className='bg-muted p-4 rounded-md'>
            <div className='grid grid-cols-1 md:grid-cols-2 gap-2'>
              {foodRelatedTypes.map((type) => (
                <div key={type} className='text-sm font-mono'>
                  {type}
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card className='p-6 lg:col-span-2'>
          <h2 className='text-2xl font-semibold mb-4'>Quick Links</h2>
          <div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4'>
            {googlePlacesApiData.links.map((link) => {
              // Determine icon based on link title or href
              let icon = <ExternalLink className='h-4 w-4' />;
              if (link.title.toLowerCase().includes('console')) {
                icon = <LayoutDashboard className='h-4 w-4' />;
              } else if (link.title.toLowerCase().includes('docs')) {
                icon = <FileText className='h-4 w-4' />;
              } else if (link.title.toLowerCase().includes('api')) {
                icon = <FileCode className='h-4 w-4' />;
              } else if (link.title.toLowerCase().includes('billing')) {
                icon = <GanttChart className='h-4 w-4' />;
              } else if (link.title.toLowerCase().includes('settings')) {
                icon = <Settings className='h-4 w-4' />;
              } else if (link.title.toLowerCase().includes('web')) {
                icon = <Globe className='h-4 w-4' />;
              }

              return (
                <Button
                  key={link.title}
                  variant='outline'
                  asChild
                  className='w-full h-auto py-4 px-4'
                >
                  <Link
                    href={link.href}
                    target='_blank'
                    rel='noopener noreferrer'
                    className='flex items-center gap-3 text-left'
                  >
                    {icon}
                    <span className='flex-1'>{link.title}</span>
                    <ExternalLink className='h-3 w-3 flex-shrink-0 opacity-50' />
                  </Link>
                </Button>
              );
            })}
          </div>
        </Card>
      </div>
    </div>
  );
}
