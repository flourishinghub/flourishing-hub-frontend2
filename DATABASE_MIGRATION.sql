-- ============================================
-- Course & Module Management Feature
-- Database Migration for Supabase
-- ============================================

-- Step 1: Create CourseModule table
CREATE TABLE IF NOT EXISTS "CourseModule" (
    "id" TEXT NOT NULL PRIMARY KEY DEFAULT gen_random_uuid()::text,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "posterUrl" TEXT,
    "quizLink" TEXT,
    "feedbackLink" TEXT,
    "duration" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT "CourseModule_courseId_fkey" 
        FOREIGN KEY ("courseId") 
        REFERENCES "Course"("id") 
        ON DELETE CASCADE 
        ON UPDATE CASCADE
);

-- Step 2: Add indexes to CourseModule
CREATE INDEX IF NOT EXISTS "CourseModule_courseId_order_idx" 
    ON "CourseModule"("courseId", "order");

CREATE INDEX IF NOT EXISTS "CourseModule_isActive_idx" 
    ON "CourseModule"("isActive");

-- Step 3: Add posterUrl to Course table
ALTER TABLE "Course" 
    ADD COLUMN IF NOT EXISTS "posterUrl" TEXT;

-- Step 4: Add course and module references to Event table
ALTER TABLE "Event" 
    ADD COLUMN IF NOT EXISTS "courseId" TEXT,
    ADD COLUMN IF NOT EXISTS "courseModuleId" TEXT,
    ADD COLUMN IF NOT EXISTS "batch" TEXT;

-- Step 5: Add foreign key constraints to Event table
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Event_courseId_fkey'
    ) THEN
        ALTER TABLE "Event" 
            ADD CONSTRAINT "Event_courseId_fkey" 
            FOREIGN KEY ("courseId") 
            REFERENCES "Course"("id") 
            ON DELETE SET NULL 
            ON UPDATE CASCADE;
    END IF;
END $$;

DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conname = 'Event_courseModuleId_fkey'
    ) THEN
        ALTER TABLE "Event" 
            ADD CONSTRAINT "Event_courseModuleId_fkey" 
            FOREIGN KEY ("courseModuleId") 
            REFERENCES "CourseModule"("id") 
            ON DELETE SET NULL 
            ON UPDATE CASCADE;
    END IF;
END $$;

-- Step 6: Add indexes to Event table for new columns
CREATE INDEX IF NOT EXISTS "Event_courseId_idx" 
    ON "Event"("courseId");

CREATE INDEX IF NOT EXISTS "Event_courseModuleId_idx" 
    ON "Event"("courseModuleId");

CREATE INDEX IF NOT EXISTS "Event_batch_idx" 
    ON "Event"("batch");

-- Step 7: Create trigger to update updatedAt timestamp for CourseModule
CREATE OR REPLACE FUNCTION update_course_module_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW."updatedAt" = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_course_module_timestamp ON "CourseModule";

CREATE TRIGGER update_course_module_timestamp
    BEFORE UPDATE ON "CourseModule"
    FOR EACH ROW
    EXECUTE FUNCTION update_course_module_updated_at();

-- ============================================
-- Verification Queries
-- ============================================

-- Check if CourseModule table exists
SELECT EXISTS (
    SELECT FROM information_schema.tables 
    WHERE table_name = 'CourseModule'
) AS course_module_exists;

-- Check if new columns added to Course
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Course' 
    AND column_name = 'posterUrl';

-- Check if new columns added to Event
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'Event' 
    AND column_name IN ('courseId', 'courseModuleId', 'batch');

-- Check indexes
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename IN ('CourseModule', 'Event') 
    AND indexname LIKE '%course%';

-- ============================================
-- Sample Data (Optional - for testing)
-- ============================================

-- Insert sample course
INSERT INTO "Course" (
    "id", "name", "description", "posterUrl", "status", "createdAt", "updatedAt"
) VALUES (
    gen_random_uuid()::text,
    'Mentorship Program',
    'A comprehensive mentorship program for students',
    'https://example.com/mentorship-poster.jpg',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
) ON CONFLICT DO NOTHING;

-- Insert sample modules (replace 'COURSE_ID_HERE' with actual course ID)
-- INSERT INTO "CourseModule" (
--     "id", "courseId", "title", "description", "posterUrl", 
--     "quizLink", "feedbackLink", "duration", "order", "createdAt", "updatedAt"
-- ) VALUES 
-- (
--     gen_random_uuid()::text,
--     'COURSE_ID_HERE',
--     'Introduction to Mindfulness',
--     'Learn the basics of mindfulness and meditation',
--     'https://example.com/mindfulness-poster.jpg',
--     'https://forms.gle/quiz1',
--     'https://forms.gle/feedback1',
--     '2 hours',
--     1,
--     CURRENT_TIMESTAMP,
--     CURRENT_TIMESTAMP
-- ),
-- (
--     gen_random_uuid()::text,
--     'COURSE_ID_HERE',
--     'Stress Management Techniques',
--     'Practical techniques to manage stress effectively',
--     'https://example.com/stress-poster.jpg',
--     'https://forms.gle/quiz2',
--     'https://forms.gle/feedback2',
--     '2 hours',
--     2,
--     CURRENT_TIMESTAMP,
--     CURRENT_TIMESTAMP
-- );

-- ============================================
-- Rollback Script (if needed)
-- ============================================

-- CAUTION: This will delete all data in CourseModule table
-- and remove columns from Course and Event tables

-- DROP TRIGGER IF EXISTS update_course_module_timestamp ON "CourseModule";
-- DROP FUNCTION IF EXISTS update_course_module_updated_at();
-- DROP TABLE IF EXISTS "CourseModule" CASCADE;
-- ALTER TABLE "Course" DROP COLUMN IF EXISTS "posterUrl";
-- ALTER TABLE "Event" DROP COLUMN IF EXISTS "courseId";
-- ALTER TABLE "Event" DROP COLUMN IF EXISTS "courseModuleId";
-- ALTER TABLE "Event" DROP COLUMN IF EXISTS "batch";
