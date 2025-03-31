

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pgsodium";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgjwt" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";





SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."Category" (
    "id" integer NOT NULL,
    "emoji" "text" NOT NULL,
    "name" "text" NOT NULL,
    "keywords" "text"[]
);


ALTER TABLE "public"."Category" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Favorite" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "placeId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Favorite" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Merchant" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Merchant" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Photo" (
    "id" "text" NOT NULL,
    "placeId" "text" NOT NULL,
    "url" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Photo" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Place" (
    "id" "text" NOT NULL,
    "name" "text",
    "description" "text",
    "latitude" double precision,
    "longitude" double precision,
    "address" "text",
    "merchantId" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Place" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Rating" (
    "id" "text" NOT NULL,
    "userId" "text" NOT NULL,
    "placeId" "text" NOT NULL,
    "rating" integer NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Rating" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."Review" (
    "id" "text" NOT NULL,
    "placeId" "text" NOT NULL,
    "name" "text" NOT NULL,
    "relativePublishTimeDescription" "text" NOT NULL,
    "rating" integer NOT NULL,
    "text" "text" NOT NULL,
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."Review" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."User" (
    "id" "text" NOT NULL,
    "email" "text" NOT NULL,
    "username" "text",
    "firstName" "text",
    "lastName" "text",
    "imageUrl" "text",
    "createdAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL,
    "updatedAt" timestamp(3) without time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);


ALTER TABLE "public"."User" OWNER TO "postgres";


ALTER TABLE ONLY "public"."Category"
    ADD CONSTRAINT "Category_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Favorite"
    ADD CONSTRAINT "Favorite_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Merchant"
    ADD CONSTRAINT "Merchant_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Photo"
    ADD CONSTRAINT "Photo_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Place"
    ADD CONSTRAINT "Place_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Rating"
    ADD CONSTRAINT "Rating_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."Review"
    ADD CONSTRAINT "Review_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."User"
    ADD CONSTRAINT "User_pkey" PRIMARY KEY ("id");



CREATE UNIQUE INDEX "Category_emoji_key" ON "public"."Category" USING "btree" ("emoji");



CREATE UNIQUE INDEX "Category_name_key" ON "public"."Category" USING "btree" ("name");



CREATE INDEX "Favorite_placeId_idx" ON "public"."Favorite" USING "btree" ("placeId");



CREATE INDEX "Favorite_userId_idx" ON "public"."Favorite" USING "btree" ("userId");



CREATE UNIQUE INDEX "Favorite_userId_placeId_key" ON "public"."Favorite" USING "btree" ("userId", "placeId");



CREATE UNIQUE INDEX "Merchant_userId_key" ON "public"."Merchant" USING "btree" ("userId");



CREATE INDEX "Place_merchantId_idx" ON "public"."Place" USING "btree" ("merchantId");



CREATE INDEX "Place_name_idx" ON "public"."Place" USING "btree" ("name");



CREATE INDEX "Rating_placeId_idx" ON "public"."Rating" USING "btree" ("placeId");



CREATE INDEX "Rating_userId_idx" ON "public"."Rating" USING "btree" ("userId");



CREATE UNIQUE INDEX "Rating_userId_placeId_key" ON "public"."Rating" USING "btree" ("userId", "placeId");



CREATE UNIQUE INDEX "User_email_key" ON "public"."User" USING "btree" ("email");



CREATE INDEX "User_id_idx" ON "public"."User" USING "btree" ("id");



CREATE UNIQUE INDEX "User_id_key" ON "public"."User" USING "btree" ("id");



ALTER TABLE ONLY "public"."Favorite"
    ADD CONSTRAINT "Favorite_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."Place"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Favorite"
    ADD CONSTRAINT "Favorite_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Merchant"
    ADD CONSTRAINT "Merchant_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Photo"
    ADD CONSTRAINT "Photo_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."Place"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Place"
    ADD CONSTRAINT "Place_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "public"."Merchant"("id") ON UPDATE CASCADE ON DELETE SET NULL;



ALTER TABLE ONLY "public"."Rating"
    ADD CONSTRAINT "Rating_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."Place"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Rating"
    ADD CONSTRAINT "Rating_userId_fkey" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON UPDATE CASCADE ON DELETE CASCADE;



ALTER TABLE ONLY "public"."Review"
    ADD CONSTRAINT "Review_placeId_fkey" FOREIGN KEY ("placeId") REFERENCES "public"."Place"("id") ON UPDATE CASCADE ON DELETE CASCADE;





ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";



































































































































































































GRANT ALL ON TABLE "public"."Category" TO "anon";
GRANT ALL ON TABLE "public"."Category" TO "authenticated";
GRANT ALL ON TABLE "public"."Category" TO "service_role";



GRANT ALL ON TABLE "public"."Favorite" TO "anon";
GRANT ALL ON TABLE "public"."Favorite" TO "authenticated";
GRANT ALL ON TABLE "public"."Favorite" TO "service_role";



GRANT ALL ON TABLE "public"."Merchant" TO "anon";
GRANT ALL ON TABLE "public"."Merchant" TO "authenticated";
GRANT ALL ON TABLE "public"."Merchant" TO "service_role";



GRANT ALL ON TABLE "public"."Photo" TO "anon";
GRANT ALL ON TABLE "public"."Photo" TO "authenticated";
GRANT ALL ON TABLE "public"."Photo" TO "service_role";



GRANT ALL ON TABLE "public"."Place" TO "anon";
GRANT ALL ON TABLE "public"."Place" TO "authenticated";
GRANT ALL ON TABLE "public"."Place" TO "service_role";



GRANT ALL ON TABLE "public"."Rating" TO "anon";
GRANT ALL ON TABLE "public"."Rating" TO "authenticated";
GRANT ALL ON TABLE "public"."Rating" TO "service_role";



GRANT ALL ON TABLE "public"."Review" TO "anon";
GRANT ALL ON TABLE "public"."Review" TO "authenticated";
GRANT ALL ON TABLE "public"."Review" TO "service_role";



GRANT ALL ON TABLE "public"."User" TO "anon";
GRANT ALL ON TABLE "public"."User" TO "authenticated";
GRANT ALL ON TABLE "public"."User" TO "service_role";



ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS  TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES  TO "service_role";






























RESET ALL;
