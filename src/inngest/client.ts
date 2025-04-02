import { EventSchemas, Inngest } from 'inngest';
import type { DetailResponse } from '@/types/details';

type HelloWorld = {
  data: {
    id: string;
    details: DetailResponse;
  };
};

type Events = {
  'places/upsert': HelloWorld;
};

export const inngest = new Inngest({
  id: 'my-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
