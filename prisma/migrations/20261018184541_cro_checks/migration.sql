-- CreateTable
CREATE TABLE "cro_checks" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "titel" TEXT NOT NULL,
    "url" TEXT,
    "bron" TEXT NOT NULL DEFAULT 'url',
    "pagina_tekst" TEXT NOT NULL,
    "analyse" JSONB,
    "aangemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bijgewerkt_op" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "cro_checks_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "cro_checks_project_id_idx" ON "cro_checks"("project_id");

-- AddForeignKey
ALTER TABLE "cro_checks" ADD CONSTRAINT "cro_checks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE SET NULL ON UPDATE CASCADE;
