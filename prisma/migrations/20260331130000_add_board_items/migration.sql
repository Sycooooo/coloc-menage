CREATE TABLE "BoardItem" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'text',
    "color" TEXT NOT NULL DEFAULT 'yellow',
    "imageUrl" TEXT,
    "linkUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "colocId" TEXT NOT NULL,
    "createdById" TEXT NOT NULL,
    CONSTRAINT "BoardItem_pkey" PRIMARY KEY ("id")
);
ALTER TABLE "BoardItem" ADD CONSTRAINT "BoardItem_colocId_fkey" FOREIGN KEY ("colocId") REFERENCES "Colocation"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "BoardItem" ADD CONSTRAINT "BoardItem_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
