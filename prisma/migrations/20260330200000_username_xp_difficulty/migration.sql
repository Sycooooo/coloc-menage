ALTER TABLE "User" DROP COLUMN "email";
ALTER TABLE "User" RENAME COLUMN "name" TO "username";
ALTER TABLE "User" ADD COLUMN "xp" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Task" ADD COLUMN "difficulty" TEXT NOT NULL DEFAULT 'medium';
CREATE UNIQUE INDEX "User_username_key" ON "User"("username");
