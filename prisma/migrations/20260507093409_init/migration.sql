-- CreateTable
CREATE TABLE "orders" (
    "id" TEXT NOT NULL,
    "external_code" TEXT,
    "sender_name" TEXT NOT NULL,
    "sender_phone" TEXT NOT NULL,
    "sender_address" TEXT NOT NULL,
    "receiver_name" TEXT NOT NULL,
    "receiver_phone" TEXT NOT NULL,
    "receiver_address" TEXT NOT NULL,
    "weight" DOUBLE PRECISION NOT NULL,
    "quantity" INTEGER NOT NULL,
    "temp_zone" TEXT NOT NULL,
    "remark" TEXT,
    "batch_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "orders_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "template_mappings" (
    "id" TEXT NOT NULL,
    "fingerprint" TEXT NOT NULL,
    "mapping" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "template_mappings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "template_mappings_fingerprint_key" ON "template_mappings"("fingerprint");
