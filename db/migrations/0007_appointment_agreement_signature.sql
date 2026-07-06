ALTER TABLE appointments ADD COLUMN agreement_signature TEXT;
ALTER TABLE appointments ADD COLUMN agreement_signer_name TEXT NOT NULL DEFAULT '';
ALTER TABLE appointments ADD COLUMN agreement_signed_at TEXT;
