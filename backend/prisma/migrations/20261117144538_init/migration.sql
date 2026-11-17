-- CreateTable
CREATE TABLE "Link" (
    "id" BIGSERIAL NOT NULL,
    "code" VARCHAR(16) NOT NULL,
    "url" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Link_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Link_code_key" ON "Link"("code");
