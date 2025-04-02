import { EventSchemas, Inngest } from 'inngest';

type HelloWorld = {
  data: {
    id: string;
  };
};

type Events = {
  'hello/world': HelloWorld;
};

export const inngest = new Inngest({
  id: 'my-app',
  schemas: new EventSchemas().fromRecord<Events>(),
});
