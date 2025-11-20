-- CreateTable
CREATE TABLE "revealed_profiles" (
    "userId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "revealedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "revealed_profiles_pkey" PRIMARY KEY ("userId","cardId")
);

-- AddForeignKey
ALTER TABLE "revealed_profiles" ADD CONSTRAINT "revealed_profiles_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "revealed_profiles" ADD CONSTRAINT "revealed_profiles_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "matching_cards"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
