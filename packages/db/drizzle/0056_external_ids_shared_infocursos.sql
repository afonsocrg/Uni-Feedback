-- An InfoCursos programme can map to several of our degrees: Nova IMS publishes one master
-- with several specializations (one InfoCursos code), and we list each specialization as its
-- own degree. Each of them shows the programme's figures, labelled as the programme's.
-- Every other source keeps "an outside id belongs to one degree of ours".
-- (Merging the IMS specializations into one degree with optional courses is a separate,
-- later decision: todo.md.)
--
-- Re-runnable.

ALTER TABLE "sources"."degree_external_ids"
  DROP CONSTRAINT IF EXISTS "degree_external_ids_source_external_id_unique";

DO $$ BEGIN
  ALTER TABLE "sources"."degree_external_ids"
    ADD CONSTRAINT "degree_external_ids_source_external_id_degree_unique" UNIQUE ("source", "external_id", "degree_id");
EXCEPTION WHEN duplicate_object OR duplicate_table THEN NULL;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS "degree_external_ids_one_degree_per_id"
  ON "sources"."degree_external_ids" ("source", "external_id")
  WHERE "source" <> 'infocursos';
