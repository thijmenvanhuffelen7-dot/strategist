-- CreateTable
CREATE TABLE "profiel" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "naam" TEXT,
    "standaard_taal" TEXT NOT NULL DEFAULT 'Nederlands',
    "standaard_platform" TEXT NOT NULL DEFAULT 'Meta',
    "drempels" JSONB NOT NULL DEFAULT '{"hook_rate":30,"hold_rate":10,"ctr":1,"cpa":30,"roas":2}',
    "tag_lijsten" JSONB NOT NULL DEFAULT '{}',
    "ai_model" TEXT,
    "bijgewerkt_op" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "profiel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "omschrijving" TEXT,
    "prijs" TEXT,
    "url" TEXT,
    "landingspagina_tekst" TEXT,
    "doelgroep" TEXT,
    "platforms" JSONB NOT NULL DEFAULT '[]',
    "doel" TEXT,
    "taal" TEXT NOT NULL DEFAULT 'Nederlands',
    "concurrenten" JSONB NOT NULL DEFAULT '[]',
    "klantdata" TEXT,
    "drempels" JSONB NOT NULL DEFAULT '{}',
    "is_voorbeeld" BOOLEAN NOT NULL DEFAULT false,
    "aangemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bijgewerkt_op" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "research" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "pijnpunten" JSONB NOT NULL DEFAULT '[]',
    "verlangens" JSONB NOT NULL DEFAULT '[]',
    "bezwaren" JSONB NOT NULL DEFAULT '[]',
    "aha_momenten" JSONB NOT NULL DEFAULT '[]',
    "klanttaal" JSONB NOT NULL DEFAULT '[]',
    "bewustzijnsniveau" JSONB,
    "goedgekeurd" BOOLEAN NOT NULL DEFAULT false,
    "bijgewerkt_op" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "research_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "angles" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "naam" TEXT NOT NULL,
    "type" TEXT,
    "kernboodschap" TEXT,
    "doelgroep" TEXT,
    "onderbouwing" TEXT,
    "risico" TEXT,
    "score" INTEGER,
    "geselecteerd" BOOLEAN NOT NULL DEFAULT false,
    "eigen" BOOLEAN NOT NULL DEFAULT false,
    "aangemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "angles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hooks" (
    "id" TEXT NOT NULL,
    "angle_id" TEXT,
    "project_id" TEXT NOT NULL,
    "gesproken" TEXT,
    "overlay" TEXT,
    "eerste_shot" TEXT,
    "type" TEXT,
    "ster" BOOLEAN NOT NULL DEFAULT false,
    "aangemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "hooks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "briefs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "angle_id" TEXT,
    "hook_id" TEXT,
    "titel" TEXT NOT NULL DEFAULT 'Naamloze brief',
    "inhoud" JSONB NOT NULL DEFAULT '{}',
    "status" TEXT NOT NULL DEFAULT 'concept',
    "share_token" TEXT,
    "aangemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bijgewerkt_op" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "briefs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "swipe_items" (
    "id" TEXT NOT NULL,
    "titel" TEXT NOT NULL,
    "merk" TEXT,
    "platform" TEXT,
    "url" TEXT,
    "media_url" TEXT,
    "transcript" TEXT,
    "tags" JSONB NOT NULL DEFAULT '{}',
    "analyse" JSONB,
    "notities" TEXT,
    "beoordeling" INTEGER,
    "aangemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "swipe_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "brief_swipe_links" (
    "brief_id" TEXT NOT NULL,
    "swipe_id" TEXT NOT NULL,

    CONSTRAINT "brief_swipe_links_pkey" PRIMARY KEY ("brief_id","swipe_id")
);

-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "brief_id" TEXT,
    "naam" TEXT NOT NULL,
    "angle" TEXT,
    "hook" TEXT,
    "format" TEXT,
    "platform" TEXT,
    "live_datum" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'testen',
    "metrics" JSONB NOT NULL DEFAULT '{}',
    "hypothese" TEXT,
    "les" TEXT,
    "aangemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "bijgewerkt_op" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "prompt_templates" (
    "id" TEXT NOT NULL,
    "functie" TEXT NOT NULL,
    "systeemprompt" TEXT NOT NULL,
    "bijgewerkt_op" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "prompt_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ai_outputs" (
    "id" TEXT NOT NULL,
    "project_id" TEXT,
    "functie" TEXT NOT NULL,
    "ref_id" TEXT,
    "output" JSONB NOT NULL,
    "model" TEXT,
    "input_tokens" INTEGER,
    "output_tokens" INTEGER,
    "aangemaakt_op" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ai_outputs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "research_project_id_key" ON "research"("project_id");

-- CreateIndex
CREATE INDEX "angles_project_id_idx" ON "angles"("project_id");

-- CreateIndex
CREATE INDEX "hooks_project_id_idx" ON "hooks"("project_id");

-- CreateIndex
CREATE INDEX "hooks_angle_id_idx" ON "hooks"("angle_id");

-- CreateIndex
CREATE UNIQUE INDEX "briefs_share_token_key" ON "briefs"("share_token");

-- CreateIndex
CREATE INDEX "briefs_project_id_idx" ON "briefs"("project_id");

-- CreateIndex
CREATE INDEX "tests_project_id_idx" ON "tests"("project_id");

-- CreateIndex
CREATE UNIQUE INDEX "prompt_templates_functie_key" ON "prompt_templates"("functie");

-- CreateIndex
CREATE INDEX "ai_outputs_functie_project_id_aangemaakt_op_idx" ON "ai_outputs"("functie", "project_id", "aangemaakt_op");

-- AddForeignKey
ALTER TABLE "research" ADD CONSTRAINT "research_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "angles" ADD CONSTRAINT "angles_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hooks" ADD CONSTRAINT "hooks_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hooks" ADD CONSTRAINT "hooks_angle_id_fkey" FOREIGN KEY ("angle_id") REFERENCES "angles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_angle_id_fkey" FOREIGN KEY ("angle_id") REFERENCES "angles"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "briefs" ADD CONSTRAINT "briefs_hook_id_fkey" FOREIGN KEY ("hook_id") REFERENCES "hooks"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief_swipe_links" ADD CONSTRAINT "brief_swipe_links_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "brief_swipe_links" ADD CONSTRAINT "brief_swipe_links_swipe_id_fkey" FOREIGN KEY ("swipe_id") REFERENCES "swipe_items"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_brief_id_fkey" FOREIGN KEY ("brief_id") REFERENCES "briefs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ai_outputs" ADD CONSTRAINT "ai_outputs_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
