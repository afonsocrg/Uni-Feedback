-- Add email_suffixes column to faculties table
ALTER TABLE faculties ADD COLUMN email_suffixes TEXT;

-- Update existing faculties with their email suffixes
UPDATE faculties SET email_suffixes = '["@tecnico.ulisboa.pt", "@ist.utl.pt"]' WHERE short_name = 'IST';
UPDATE faculties SET email_suffixes = '["@novasbe.pt"]' WHERE short_name = 'Nova SBE';
UPDATE faculties SET email_suffixes = '["@fct.unl.pt"]' WHERE short_name = 'Nova FCT';