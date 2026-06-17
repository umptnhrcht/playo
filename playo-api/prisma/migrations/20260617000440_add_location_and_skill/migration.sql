-- CreateEnum
CREATE TYPE "SkillLevel" AS ENUM ('ALL', 'BEGINNER', 'INTERMEDIATE', 'PRO');

-- AlterTable
ALTER TABLE "Game" ADD COLUMN     "areaTags" TEXT[],
ADD COLUMN     "lat" DOUBLE PRECISION,
ADD COLUMN     "lng" DOUBLE PRECISION,
ADD COLUMN     "placeId" TEXT,
ADD COLUMN     "skillLevel" "SkillLevel" NOT NULL DEFAULT 'ALL';

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "favoriteSports" "Sport"[],
ADD COLUMN     "homeArea" TEXT;

-- CreateIndex
CREATE INDEX "Game_scheduledAt_idx" ON "Game"("scheduledAt");

-- CreateIndex
CREATE INDEX "Game_sport_idx" ON "Game"("sport");

-- CreateIndex
CREATE INDEX "Game_status_idx" ON "Game"("status");

-- CreateIndex
CREATE INDEX "Game_lat_lng_idx" ON "Game"("lat", "lng");
