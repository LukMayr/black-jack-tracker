/*
  Warnings:

  - A unique constraint covering the columns `[userId,roomId]` on the table `UserRoom` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserRoom_userId_roomId_key" ON "UserRoom"("userId", "roomId");
