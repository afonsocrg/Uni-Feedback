-- Add description and url fields to degrees table
ALTER TABLE degrees ADD COLUMN description TEXT;
ALTER TABLE degrees ADD COLUMN url TEXT;

-- Add bibliography field to courses table
ALTER TABLE courses ADD COLUMN bibliography TEXT;

-- Add has_mandatory_exam field to courses table
ALTER TABLE courses ADD COLUMN has_mandatory_exam INTEGER;