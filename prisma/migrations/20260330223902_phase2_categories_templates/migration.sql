-- AlterTable
ALTER TABLE "Task" ADD COLUMN     "category" TEXT,
ADD COLUMN     "room" TEXT;

-- CreateTable
CREATE TABLE "QuestTemplate" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "category" TEXT NOT NULL,
    "room" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'medium',
    "recurrence" TEXT NOT NULL DEFAULT 'weekly',

    CONSTRAINT "QuestTemplate_pkey" PRIMARY KEY ("id")
);
