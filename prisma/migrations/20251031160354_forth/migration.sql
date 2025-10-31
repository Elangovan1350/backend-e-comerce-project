-- AlterTable
ALTER TABLE "Users" ADD CONSTRAINT "Users_pkey" PRIMARY KEY ("id");

-- DropIndex
DROP INDEX "public"."Users_id_key";
