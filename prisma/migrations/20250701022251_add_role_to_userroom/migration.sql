-- CreateEnum
CREATE TYPE "Role" AS ENUM ('OWNER', 'PLAYER');

-- AlterTable
ALTER TABLE "UserRoom" ADD COLUMN     "role" "Role" NOT NULL DEFAULT 'PLAYER';
