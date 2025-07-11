CREATE TABLE `course_relationships` (
	`source_course_id` integer NOT NULL,
	`target_course_id` integer NOT NULL,
	`relationship_type` text DEFAULT 'identical' NOT NULL,
	`created_at` integer,
	PRIMARY KEY(`source_course_id`, `target_course_id`, `relationship_type`),
	FOREIGN KEY (`source_course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE restrict,
	FOREIGN KEY (`target_course_id`) REFERENCES `courses`(`id`) ON UPDATE no action ON DELETE restrict
);
--> statement-breakpoint
CREATE INDEX `idx_course_relationships_source_relationship` ON `course_relationships` (`source_course_id`, `relationship_type`);
--> statement-breakpoint
CREATE INDEX `idx_course_relationships_target_relationship` ON `course_relationships` (`target_course_id`, `relationship_type`);
--> statement-breakpoint
-- Constraint to prevent a course from relating to itself
CREATE TRIGGER prevent_self_relationship
    BEFORE INSERT ON course_relationships
    FOR EACH ROW
    WHEN NEW.source_course_id = NEW.target_course_id
    BEGIN
        SELECT RAISE(ABORT, 'A course cannot relate to itself');
    END;