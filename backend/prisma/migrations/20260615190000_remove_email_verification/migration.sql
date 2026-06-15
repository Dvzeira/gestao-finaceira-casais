-- DropForeignKey
ALTER TABLE "email_verification_tokens" DROP CONSTRAINT "email_verification_tokens_userId_fkey";

-- DropTable
DROP TABLE "email_verification_tokens";

-- AlterTable
ALTER TABLE "users" DROP COLUMN "emailVerifiedAt";
