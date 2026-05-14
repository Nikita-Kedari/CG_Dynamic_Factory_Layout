-- =============================================================
-- FloorViz — Schema Patch v2
-- Run in SSMS against FactoryLayoutDB
-- =============================================================
USE FactoryLayoutDB;
GO

-- ── 1. Add workflow status columns to LAYOUT_VERSIONS ────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('LAYOUT_VERSIONS') AND name = 'status')
    ALTER TABLE LAYOUT_VERSIONS ADD status NVARCHAR(20) NOT NULL DEFAULT 'draft';
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('LAYOUT_VERSIONS') AND name = 'admin_comments')
    ALTER TABLE LAYOUT_VERSIONS ADD admin_comments NVARCHAR(MAX) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('LAYOUT_VERSIONS') AND name = 'reviewed_by')
    ALTER TABLE LAYOUT_VERSIONS ADD reviewed_by NVARCHAR(100) NULL;
GO

IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('LAYOUT_VERSIONS') AND name = 'reviewed_at')
    ALTER TABLE LAYOUT_VERSIONS ADD reviewed_at DATETIME2 NULL;
GO

-- ── 2. Add tooltip detail column to WORKSTATIONS ─────────────
IF NOT EXISTS (SELECT 1 FROM sys.columns WHERE object_id = OBJECT_ID('WORKSTATIONS') AND name = 'detail')
    ALTER TABLE WORKSTATIONS ADD detail NVARCHAR(500) NULL;
GO

-- ── 3. Backfill existing rows with status = 'draft' ──────────
UPDATE LAYOUT_VERSIONS SET status = 'draft' WHERE status IS NULL OR status = '';
GO

PRINT 'Patch v2 applied successfully.';
GO
