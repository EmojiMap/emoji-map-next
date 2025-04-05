import { EventSchemas, Inngest } from 'inngest';
import type { DetailResponse } from '@/types/details';

type PlaceCreate = {
  data: {
    id: string;
    details: DetailResponse;
  };
};

type PlaceCreatePhotos = {
  data: {
    id: string;
    photos: string[];
  };
};

type Events = {
  'places/create': PlaceCreate;
  'places/create-photos': PlaceCreatePhotos;
};

export const inngest = new Inngest({
  id: 'my-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
