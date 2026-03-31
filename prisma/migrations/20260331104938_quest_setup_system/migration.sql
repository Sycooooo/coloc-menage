-- AlterTable
ALTER TABLE "Colocation" ADD COLUMN     "maxQuestsPerDay" INTEGER NOT NULL DEFAULT 2,
ADD COLUMN     "questsSetupDone" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "ColocTemplate" (
    "id" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "templateId" TEXT,
    "title" TEXT,
    "description" TEXT,
    "category" TEXT,
    "room" TEXT,
    "difficulty" TEXT,
    "recurrence" TEXT,
    "colocId" TEXT NOT NULL,

    CONSTRAINT "ColocTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MemberAffinity" (
    "id" TEXT NOT NULL,
    "weight" INTEGER NOT NULL DEFAULT 1,
    "userId" TEXT NOT NULL,
    "colocId" TEXT NOT NULL,
    "category" TEXT NOT NULL,

    CONSTRAINT "MemberAffinity_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ColocTemplate_templateId_colocId_key" ON "ColocTemplate"("templateId", "colocId");

-- CreateIndex
CREATE UNIQUE INDEX "MemberAffinity_userId_colocId_category_key" ON "MemberAffinity"("userId", "colocId", "category");

-- AddForeignKey
ALTER TABLE "ColocTemplate" ADD CONSTRAINT "ColocTemplate_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuestTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ColocTemplate" ADD CONSTRAINT "ColocTemplate_colocId_fkey" FOREIGN KEY ("colocId") REFERENCES "Colocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MemberAffinity" ADD CONSTRAINT "MemberAffinity_colocId_fkey" FOREIGN KEY ("colocId") REFERENCES "Colocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
