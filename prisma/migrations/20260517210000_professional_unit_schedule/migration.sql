-- Drop workingDays (moved to ProfessionalUnit.schedule)
ALTER TABLE "Professional" DROP COLUMN IF EXISTS "workingDays";

-- CreateTable
CREATE TABLE "ProfessionalUnit" (
    "id" TEXT NOT NULL,
    "professionalId" TEXT NOT NULL,
    "unitId" TEXT NOT NULL,
    "schedule" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "ProfessionalUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ProfessionalUnit_professionalId_unitId_key" ON "ProfessionalUnit"("professionalId", "unitId");

-- AddForeignKey
ALTER TABLE "ProfessionalUnit" ADD CONSTRAINT "ProfessionalUnit_professionalId_fkey" FOREIGN KEY ("professionalId") REFERENCES "Professional"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfessionalUnit" ADD CONSTRAINT "ProfessionalUnit_unitId_fkey" FOREIGN KEY ("unitId") REFERENCES "Unit"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Seed ProfessionalUnit from existing unitId
INSERT INTO "ProfessionalUnit" ("id", "professionalId", "unitId", "schedule")
SELECT gen_random_uuid(), id, "unitId", '{}'::jsonb
FROM "Professional";
