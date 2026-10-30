-- Keep added_by as audit metadata; account notification routing has its own field.
ALTER TABLE allowed_users ADD COLUMN notification_admin_id INTEGER;
