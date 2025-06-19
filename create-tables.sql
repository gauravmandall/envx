-- Create the environment_variables table if it doesn't exist
CREATE TABLE IF NOT EXISTS "environment_variables" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "encrypted_value" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "environment_variables_pkey" PRIMARY KEY ("id")
);

-- Create unique index on name if it doesn't exist
CREATE UNIQUE INDEX IF NOT EXISTS "environment_variables_name_key" ON "environment_variables"("name"); 