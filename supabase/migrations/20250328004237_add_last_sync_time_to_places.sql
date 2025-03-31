-- AlterTable
ALTER TABLE "places" ADD COLUMN "last_synced_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "places_last_synced_at_idx" ON "places"("last_synced_at"); 