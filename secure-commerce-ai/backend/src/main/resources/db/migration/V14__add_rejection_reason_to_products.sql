-- V14__add_rejection_reason_to_products.sql
-- Adds an optional rejection_reason column to products for admin moderation feedback

ALTER TABLE products ADD COLUMN rejection_reason VARCHAR(1000);
