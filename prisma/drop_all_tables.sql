-- Drop all Listy tables in correct order (respecting foreign keys)
-- Run this in Supabase SQL Editor to clean the database

-- Drop PPC-related tables
DROP TABLE IF EXISTS "ppc_audit_reports" CASCADE;
DROP TABLE IF EXISTS "ppc_dayparting_schedules" CASCADE;
DROP TABLE IF EXISTS "ppc_automation_rules" CASCADE;
DROP TABLE IF EXISTS "ppc_bid_predictions" CASCADE;
DROP TABLE IF EXISTS "ppc_keyword_quality_scores" CASCADE;
DROP TABLE IF EXISTS "ppc_keyword_metrics" CASCADE;
DROP TABLE IF EXISTS "ppc_keywords" CASCADE;
DROP TABLE IF EXISTS "ppc_ad_group_metrics" CASCADE;
DROP TABLE IF EXISTS "ppc_ad_groups" CASCADE;
DROP TABLE IF EXISTS "ppc_campaign_metrics" CASCADE;
DROP TABLE IF EXISTS "ppc_campaigns" CASCADE;

-- Drop main application tables
DROP TABLE IF EXISTS "search_history" CASCADE;
DROP TABLE IF EXISTS "keyword_research" CASCADE;
DROP TABLE IF EXISTS "drafts" CASCADE;
DROP TABLE IF EXISTS "keywords" CASCADE;
DROP TABLE IF EXISTS "ingests" CASCADE;
DROP TABLE IF EXISTS "users" CASCADE;

-- Verify all tables are dropped
SELECT tablename FROM pg_tables WHERE schemaname = 'public';
