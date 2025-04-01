/*
  Warnings:

  - You are about to drop the column `description` on the `Place` table. All the data in the column will be lost.
  - You are about to drop the column `paymentOptions` on the `Place` table. All the data in the column will be lost.
  - Added the required column `acceptsCashOnly` to the `Place` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acceptsCreditCards` to the `Place` table without a default value. This is not possible if the table is not empty.
  - Added the required column `acceptsDebitCards` to the `Place` table without a default value. This is not possible if the table is not empty.
  - Made the column `name` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `latitude` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `longitude` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `address` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `merchantId` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `allowsDogs` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `delivery` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `goodForChildren` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `dineIn` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `goodForGroups` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `isFree` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `liveMusic` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `menuForChildren` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `outdoorSeating` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `rating` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `servesCoffee` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `servesDessert` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `takeout` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `restroom` on table `Place` required. This step will fail if there are existing NULL values in that column.
  - Made the column `userRatingCount` on table `Place` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "Place" DROP CONSTRAINT "Place_merchantId_fkey";

-- AlterTable
ALTER TABLE "Place" DROP COLUMN "description",
DROP COLUMN "paymentOptions",
ADD COLUMN     "acceptsCashOnly" BOOLEAN NOT NULL,
ADD COLUMN     "acceptsCreditCards" BOOLEAN NOT NULL,
ADD COLUMN     "acceptsDebitCards" BOOLEAN NOT NULL,
ALTER COLUMN "name" SET NOT NULL,
ALTER COLUMN "latitude" SET NOT NULL,
ALTER COLUMN "longitude" SET NOT NULL,
ALTER COLUMN "address" SET NOT NULL,
ALTER COLUMN "merchantId" SET NOT NULL,
ALTER COLUMN "allowsDogs" SET NOT NULL,
ALTER COLUMN "delivery" SET NOT NULL,
ALTER COLUMN "goodForChildren" SET NOT NULL,
ALTER COLUMN "dineIn" SET NOT NULL,
ALTER COLUMN "goodForGroups" SET NOT NULL,
ALTER COLUMN "isFree" SET NOT NULL,
ALTER COLUMN "liveMusic" SET NOT NULL,
ALTER COLUMN "menuForChildren" SET NOT NULL,
ALTER COLUMN "outdoorSeating" SET NOT NULL,
ALTER COLUMN "rating" SET NOT NULL,
ALTER COLUMN "servesCoffee" SET NOT NULL,
ALTER COLUMN "servesDessert" SET NOT NULL,
ALTER COLUMN "takeout" SET NOT NULL,
ALTER COLUMN "restroom" SET NOT NULL,
ALTER COLUMN "userRatingCount" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "Place" ADD CONSTRAINT "Place_merchantId_fkey" FOREIGN KEY ("merchantId") REFERENCES "Merchant"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
