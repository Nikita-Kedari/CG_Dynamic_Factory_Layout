-- =============================================================
-- FACTORY LAYOUT PRO — SQL Server Setup Script
-- Run in SSMS: File > Open > factory-layout-pro
-- Database: FactoryLayoutDB
-- =============================================================

-- ─────────────────────────────────────────────
-- 1. CREATE DATABASE (skip if already exists)
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT name FROM sys.databases WHERE name = 'FactoryLayoutDB')
BEGIN
    CREATE DATABASE FactoryLayoutDB;
END
GO

USE FactoryLayoutDB;
GO

-- ─────────────────────────────────────────────
-- 2. FACTORIES
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'FACTORIES')
CREATE TABLE FACTORIES (
    factory_id       INT IDENTITY(1,1) PRIMARY KEY,
    factory_code     VARCHAR(50)  NOT NULL UNIQUE,
    factory_name     VARCHAR(150) NOT NULL,
    location         VARCHAR(200),
    plant_type       VARCHAR(100),
    total_land_area  FLOAT,
    built_up_area    FLOAT,
    created_at       DATETIME     DEFAULT GETDATE(),
    created_by       VARCHAR(100),
    address_line1    VARCHAR(200),
    address_line2    VARCHAR(200),
    city             VARCHAR(100),
    state            VARCHAR(100),
    country          VARCHAR(100)
);
GO

-- ─────────────────────────────────────────────
-- 3. LAYOUTS
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LAYOUTS')
CREATE TABLE LAYOUTS (
    layout_id          INT IDENTITY(1,1) PRIMARY KEY,
    factory_id         INT          NOT NULL REFERENCES FACTORIES(factory_id) ON DELETE CASCADE,
    layout_name        VARCHAR(150) NOT NULL,
    layout_description TEXT,
    unit_scale         FLOAT        DEFAULT 1.0,
    canvas_width       FLOAT        DEFAULT 1000,
    canvas_length      FLOAT        DEFAULT 600,
    is_active          BIT          DEFAULT 1,
    created_at         DATETIME     DEFAULT GETDATE(),
    layout_version_id  INT,          -- FK set after LAYOUT_VERSIONS is created
    notes              VARCHAR(500),
    tags               VARCHAR(300),
    revision           VARCHAR(50),
    approved_by        VARCHAR(100),
    approval_date      DATETIME
);
GO

-- ─────────────────────────────────────────────
-- 4. LAYOUT_VERSIONS
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'LAYOUT_VERSIONS')
CREATE TABLE LAYOUT_VERSIONS (
    layout_version_id  INT IDENTITY(1,1) PRIMARY KEY,
    layout_id          INT          NOT NULL REFERENCES LAYOUTS(layout_id) ON DELETE CASCADE,
    version_name       VARCHAR(100) NOT NULL,
    source_csv_filename VARCHAR(255),
    imported_at        DATETIME     DEFAULT GETDATE(),
    imported_by        VARCHAR(100),
    is_current_version BIT          DEFAULT 0,
    change_notes       TEXT,
    checksum           VARCHAR(64),
    export_path        VARCHAR(500),
    published_at       DATETIME,
    published_by       VARCHAR(100),
    rollback_version_id INT
);
GO

-- Back-fill FK: LAYOUTS.layout_version_id → LAYOUT_VERSIONS
IF NOT EXISTS (
    SELECT * FROM sys.foreign_keys
    WHERE name = 'FK_LAYOUTS_VERSION'
)
ALTER TABLE LAYOUTS
ADD CONSTRAINT FK_LAYOUTS_VERSION
FOREIGN KEY (layout_version_id) REFERENCES LAYOUT_VERSIONS(layout_version_id);
GO

-- ─────────────────────────────────────────────
-- 5. AREAS
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'AREAS')
CREATE TABLE AREAS (
    area_id            INT IDENTITY(1,1) PRIMARY KEY,
    layout_id          INT          NOT NULL REFERENCES LAYOUTS(layout_id) ON DELETE CASCADE,
    external_area_code VARCHAR(50),
    area_name          VARCHAR(150) NOT NULL,
    pos_x              FLOAT        DEFAULT 0,
    pos_y              FLOAT        DEFAULT 0,
    width              FLOAT        DEFAULT 200,
    length             FLOAT        DEFAULT 200,
    border_thickness   FLOAT        DEFAULT 2,
    area_type          VARCHAR(100),
    layout_version_id  INT          REFERENCES LAYOUT_VERSIONS(layout_version_id),
    color_hex          VARCHAR(10),
    is_active          BIT          DEFAULT 1,
    sort_order         INT          DEFAULT 0,
    notes              VARCHAR(500)
);
GO

-- ─────────────────────────────────────────────
-- 6. PRODUCTION_LINES
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'PRODUCTION_LINES')
CREATE TABLE PRODUCTION_LINES (
    line_id             INT IDENTITY(1,1) PRIMARY KEY,
    area_id             INT          NOT NULL REFERENCES AREAS(area_id) ON DELETE CASCADE,
    external_line_code  VARCHAR(50),
    line_name           VARCHAR(150) NOT NULL,
    line_type           VARCHAR(100),
    takt_time_sec       INT          DEFAULT 60,
    capacity_per_shift  INT          DEFAULT 100,
    is_active           BIT          DEFAULT 1,
    layout_id           INT          REFERENCES LAYOUTS(layout_id),
    layout_version_id   INT          REFERENCES LAYOUT_VERSIONS(layout_version_id),
    shift_pattern       VARCHAR(100),
    supervisor          VARCHAR(150),
    cost_center         VARCHAR(100),
    last_modified       DATETIME     DEFAULT GETDATE()
);
GO

-- ─────────────────────────────────────────────
-- 7. WORKSTATIONS
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WORKSTATIONS')
CREATE TABLE WORKSTATIONS (
    ws_id                INT IDENTITY(1,1) PRIMARY KEY,
    line_id              INT          NOT NULL REFERENCES PRODUCTION_LINES(line_id) ON DELETE CASCADE,
    ws_code              VARCHAR(50),
    ws_name              VARCHAR(150) NOT NULL,
    sequence_number      INT          DEFAULT 1,
    pos_x                FLOAT        DEFAULT 0,
    pos_y                FLOAT        DEFAULT 0,
    width                FLOAT        DEFAULT 80,
    length               FLOAT        DEFAULT 80,
    operator_required    BIT          DEFAULT 1,
    max_operators        INT          DEFAULT 1,
    power_requirement_kw FLOAT        DEFAULT 0,
    station_type         VARCHAR(100),
    is_bottleneck        BIT          DEFAULT 0,
    cycle_time_sec       INT,
    color_hex            VARCHAR(10),
    notes                VARCHAR(500)
);
GO

-- ─────────────────────────────────────────────
-- 8. WORKSTATION_FLOW
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WORKSTATION_FLOW')
CREATE TABLE WORKSTATION_FLOW (
    flow_id              INT IDENTITY(1,1) PRIMARY KEY,
    from_ws_id           INT          NOT NULL REFERENCES WORKSTATIONS(ws_id),
    to_ws_id             INT          NOT NULL REFERENCES WORKSTATIONS(ws_id),
    distance             FLOAT        DEFAULT 0,
    transport_type       VARCHAR(100),
    avg_transfer_time_sec INT         DEFAULT 0,
    flow_volume_per_hr   INT,
    is_active            BIT          DEFAULT 1,
    priority             INT          DEFAULT 1
);
GO

-- ─────────────────────────────────────────────
-- 9. WORKSTATION_PARAMETERS
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'WORKSTATION_PARAMETERS')
CREATE TABLE WORKSTATION_PARAMETERS (
    ws_parameter_id INT IDENTITY(1,1) PRIMARY KEY,
    ws_id           INT          NOT NULL REFERENCES WORKSTATIONS(ws_id) ON DELETE CASCADE,
    param_key       VARCHAR(100) NOT NULL,
    param_value     VARCHAR(500),
    param_unit      VARCHAR(50),
    data_type       VARCHAR(50),
    is_mandatory    BIT          DEFAULT 0,
    last_updated    DATETIME     DEFAULT GETDATE(),
    updated_by      VARCHAR(100),
    notes           VARCHAR(500)
);
GO

-- ─────────────────────────────────────────────
-- 10. MACHINES
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MACHINES')
CREATE TABLE MACHINES (
    machine_id           INT IDENTITY(1,1) PRIMARY KEY,
    ws_id                INT          NOT NULL REFERENCES WORKSTATIONS(ws_id) ON DELETE CASCADE,
    external_machine_code VARCHAR(50),
    machine_name         VARCHAR(150) NOT NULL,
    machine_type         VARCHAR(100),
    model_number         VARCHAR(100),
    serial_number        VARCHAR(100),
    install_date         DATE,
    rated_cycle_time_sec INT,
    power_kw             FLOAT,
    footprint_width      FLOAT,
    footprint_length     FLOAT,
    is_active            BIT          DEFAULT 1,
    expected_life_hours  INT,
    manufacturer         VARCHAR(150),
    vendor               VARCHAR(150),
    purchase_cost        FLOAT,
    warranty_until       DATE
);
GO

-- ─────────────────────────────────────────────
-- 11. MAINTENANCE_SCHEDULE
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MAINTENANCE_SCHEDULE')
CREATE TABLE MAINTENANCE_SCHEDULE (
    maintenance_id   INT IDENTITY(1,1) PRIMARY KEY,
    machine_id       INT          NOT NULL REFERENCES MACHINES(machine_id) ON DELETE CASCADE,
    maintenance_type VARCHAR(100) NOT NULL,
    frequency_hours  INT          DEFAULT 500,
    next_due_at      DATETIME,
    priority_level   VARCHAR(50)  DEFAULT 'Medium',
    is_overdue       BIT          DEFAULT 0,
    last_done_at     DATETIME,
    assigned_to      VARCHAR(150),
    estimated_hrs    FLOAT,
    notes            VARCHAR(500)
);
GO

-- ─────────────────────────────────────────────
-- 12. MACHINE_RUNTIME_STATUS
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'MACHINE_RUNTIME_STATUS')
CREATE TABLE MACHINE_RUNTIME_STATUS (
    status_id    INT IDENTITY(1,1) PRIMARY KEY,
    machine_id   INT          NOT NULL REFERENCES MACHINES(machine_id) ON DELETE CASCADE,
    status_type  VARCHAR(100) NOT NULL,   -- 'running','idle','fault','maintenance'
    status_reason VARCHAR(500),
    recorded_at  DATETIME     DEFAULT GETDATE(),
    oee_percent  FLOAT,
    uptime_hours FLOAT,
    fault_code   VARCHAR(50),
    operator_id  VARCHAR(100),
    shift        VARCHAR(50),
    notes        VARCHAR(500)
);
GO

-- ─────────────────────────────────────────────
-- 13. VEHICLE_UNITS
-- ─────────────────────────────────────────────
IF NOT EXISTS (SELECT * FROM sys.tables WHERE name = 'VEHICLE_UNITS')
CREATE TABLE VEHICLE_UNITS (
    vehicle_id       INT IDENTITY(1,1) PRIMARY KEY,
    current_ws_id    INT          REFERENCES WORKSTATIONS(ws_id),
    vin_number       VARCHAR(50)  NOT NULL UNIQUE,
    production_stage VARCHAR(100),
    status           VARCHAR(100) DEFAULT 'in_progress',
    started_at       DATETIME     DEFAULT GETDATE(),
    completed_at     DATETIME,
    model_code       VARCHAR(100),
    colour           VARCHAR(100),
    order_ref        VARCHAR(100),
    priority         INT          DEFAULT 5,
    notes            VARCHAR(500)
);
GO

-- =============================================================
-- SEED DATA — One minimal factory for development testing
-- =============================================================

-- Factory
IF NOT EXISTS (SELECT 1 FROM FACTORIES WHERE factory_code = 'AUTOPLANT-C1')
INSERT INTO FACTORIES (factory_code, factory_name, location, plant_type, total_land_area, built_up_area, created_by)
VALUES ('AUTOPLANT-C1', 'AutoPlant Pune C1', 'Pune, Maharashtra', 'Automotive Assembly', 50000, 32000, 'system');
GO

-- Layout
DECLARE @factoryId INT = (SELECT factory_id FROM FACTORIES WHERE factory_code = 'AUTOPLANT-C1');
IF NOT EXISTS (SELECT 1 FROM LAYOUTS WHERE layout_name = 'C1 Main Floor')
INSERT INTO LAYOUTS (factory_id, layout_name, layout_description, unit_scale, canvas_width, canvas_length, is_active)
VALUES (@factoryId, 'C1 Main Floor', 'Primary production floor — Automotive C1 variant', 0.1, 1200, 800, 1);
GO

-- Layout Version
DECLARE @layoutId INT = (SELECT layout_id FROM LAYOUTS WHERE layout_name = 'C1 Main Floor');
IF NOT EXISTS (SELECT 1 FROM LAYOUT_VERSIONS WHERE version_name = 'v1.0-baseline')
INSERT INTO LAYOUT_VERSIONS (layout_id, version_name, source_csv_filename, imported_by, is_current_version, change_notes)
VALUES (@layoutId, 'v1.0-baseline', 'realistic_factory_layout_C1.csv', 'system', 1, 'Initial baseline import from CSV');
GO

-- Update layout FK
DECLARE @versionId INT = (SELECT layout_version_id FROM LAYOUT_VERSIONS WHERE version_name = 'v1.0-baseline');
UPDATE LAYOUTS SET layout_version_id = @versionId WHERE layout_name = 'C1 Main Floor';
GO

-- Areas
DECLARE @layoutId INT  = (SELECT layout_id FROM LAYOUTS WHERE layout_name = 'C1 Main Floor');
DECLARE @verId   INT   = (SELECT layout_version_id FROM LAYOUT_VERSIONS WHERE version_name = 'v1.0-baseline');

IF NOT EXISTS (SELECT 1 FROM AREAS WHERE external_area_code = 'A01')
INSERT INTO AREAS (layout_id, external_area_code, area_name, pos_x, pos_y, width, length, area_type, layout_version_id, color_hex)
VALUES
    (@layoutId, 'A01', 'Body Shop',     10,  10,  380, 360, 'Production', @verId, '#1e3a5f'),
    (@layoutId, 'A02', 'Paint Shop',    410, 10,  380, 360, 'Production', @verId, '#1e5f3a'),
    (@layoutId, 'A03', 'General Assembly', 10, 390, 780, 360, 'Production', @verId, '#5f3a1e');
GO

-- Production Lines (Body Shop)
DECLARE @a01 INT = (SELECT area_id FROM AREAS WHERE external_area_code = 'A01');
DECLARE @a02 INT = (SELECT area_id FROM AREAS WHERE external_area_code = 'A02');
DECLARE @a03 INT = (SELECT area_id FROM AREAS WHERE external_area_code = 'A03');
DECLARE @lid INT = (SELECT layout_id FROM LAYOUTS WHERE layout_name = 'C1 Main Floor');
DECLARE @vid INT = (SELECT layout_version_id FROM LAYOUT_VERSIONS WHERE version_name = 'v1.0-baseline');

IF NOT EXISTS (SELECT 1 FROM PRODUCTION_LINES WHERE external_line_code = 'L01')
INSERT INTO PRODUCTION_LINES (area_id, external_line_code, line_name, line_type, takt_time_sec, capacity_per_shift, layout_id, layout_version_id)
VALUES
    (@a01, 'L01', 'Body Framing Line',   'Straight', 90,  120, @lid, @vid),
    (@a01, 'L02', 'Welding Sub-Assembly','U-Shape',  120, 80,  @lid, @vid),
    (@a02, 'L03', 'Paint Prep Line',     'Straight', 180, 60,  @lid, @vid),
    (@a02, 'L04', 'Top Coat Line',       'Straight', 200, 50,  @lid, @vid),
    (@a03, 'L05', 'Trim & Chassis Line', 'Straight', 60,  150, @lid, @vid),
    (@a03, 'L06', 'Final Quality Check', 'Straight', 45,  200, @lid, @vid);
GO

-- Workstations
DECLARE @l01 INT = (SELECT line_id FROM PRODUCTION_LINES WHERE external_line_code = 'L01');
DECLARE @l05 INT = (SELECT line_id FROM PRODUCTION_LINES WHERE external_line_code = 'L05');

IF NOT EXISTS (SELECT 1 FROM WORKSTATIONS WHERE ws_code = 'WS-BF-01')
INSERT INTO WORKSTATIONS (line_id, ws_code, ws_name, sequence_number, pos_x, pos_y, width, length, operator_required, max_operators, power_requirement_kw)
VALUES
    (@l01, 'WS-BF-01', 'Floor Pan Assembly',  1, 30,  40,  90, 80, 1, 2, 15.0),
    (@l01, 'WS-BF-02', 'Side Panel Framing',  2, 140, 40,  90, 80, 1, 2, 20.0),
    (@l01, 'WS-BF-03', 'Roof Fitting',        3, 250, 40,  90, 80, 1, 1, 10.0),
    (@l05, 'WS-GA-01', 'Engine & Trans Mount', 1, 30, 420, 90, 80, 1, 3, 25.0),
    (@l05, 'WS-GA-02', 'Dashboard Fit',        2, 140,420, 90, 80, 1, 2, 8.0),
    (@l05, 'WS-GA-03', 'Door & Glass Fit',     3, 250,420, 90, 80, 1, 2, 5.0);
GO

-- Machines for WS-BF-01
DECLARE @ws1 INT = (SELECT ws_id FROM WORKSTATIONS WHERE ws_code = 'WS-BF-01');
IF NOT EXISTS (SELECT 1 FROM MACHINES WHERE external_machine_code = 'MCH-001')
INSERT INTO MACHINES (ws_id, external_machine_code, machine_name, machine_type, model_number, serial_number, install_date, rated_cycle_time_sec, power_kw, footprint_width, footprint_length, expected_life_hours)
VALUES
    (@ws1, 'MCH-001', 'Floor Pan Spot Welder', 'Spot Welder', 'SW-X400',  'SN-001-2024', '2024-01-15', 45, 15.0, 1.2, 1.5, 50000),
    (@ws1, 'MCH-002', 'Panel Press',           'Hydraulic Press','HP-200', 'SN-002-2024', '2024-01-15', 30, 22.0, 1.5, 2.0, 40000);
GO

-- Runtime Status
DECLARE @m1 INT = (SELECT machine_id FROM MACHINES WHERE external_machine_code = 'MCH-001');
DECLARE @m2 INT = (SELECT machine_id FROM MACHINES WHERE external_machine_code = 'MCH-002');
IF NOT EXISTS (SELECT 1 FROM MACHINE_RUNTIME_STATUS WHERE machine_id = @m1)
INSERT INTO MACHINE_RUNTIME_STATUS (machine_id, status_type, oee_percent, uptime_hours, shift)
VALUES
    (@m1, 'running',     87.5, 2136.0, 'Morning'),
    (@m2, 'maintenance', 0,    0,      'Morning');
GO

-- Workstation Flow (BF-01 → BF-02 → BF-03)
DECLARE @ws1 INT = (SELECT ws_id FROM WORKSTATIONS WHERE ws_code = 'WS-BF-01');
DECLARE @ws2 INT = (SELECT ws_id FROM WORKSTATIONS WHERE ws_code = 'WS-BF-02');
DECLARE @ws3 INT = (SELECT ws_id FROM WORKSTATIONS WHERE ws_code = 'WS-BF-03');
IF NOT EXISTS (SELECT 1 FROM WORKSTATION_FLOW WHERE from_ws_id = @ws1 AND to_ws_id = @ws2)
INSERT INTO WORKSTATION_FLOW (from_ws_id, to_ws_id, distance, transport_type, avg_transfer_time_sec)
VALUES
    (@ws1, @ws2, 3.5, 'Conveyor', 12),
    (@ws2, @ws3, 3.5, 'Conveyor', 12);
GO

PRINT 'FactoryLayoutDB setup complete.';

USE FactoryLayoutDB;
SELECT 
    a.area_name, 
    pl.line_name, 
    w.ws_code, 
    w.ws_name, 
    w.pos_x, 
    w.pos_y, 
    w.detail
FROM WORKSTATIONS w
JOIN PRODUCTION_LINES pl ON w.line_id = pl.line_id
JOIN AREAS a ON pl.area_id = a.area_id
WHERE a.layout_id = (SELECT layout_id FROM LAYOUTS WHERE layout_name = 'Main Floor Layout V1')
ORDER BY a.area_name, w.sequence_number;
