-- CreateTable
CREATE TABLE "matching_cards" (
    "id" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "matchType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "authorId" TEXT NOT NULL,

    CONSTRAINT "matching_cards_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "matching_cards" ADD CONSTRAINT "matching_cards_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
