-- CreateTable
CREATE TABLE "event_entries" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "entered_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "event_entries_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "event_entries_user_id_key" ON "event_entries"("user_id");

-- AddForeignKey
ALTER TABLE "event_entries" ADD CONSTRAINT "event_entries_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
