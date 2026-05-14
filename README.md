# Dynamic Factory Layout Tool (SQL Integrated)

A state-of-the-art factory layout visualization and management tool. This project enables dynamic parameter management for factory workstations, synchronized in real-time with a SQL Server database.

## 🚀 Features
- **Dynamic Parameter Sync:** Add/remove columns in SQL Server, and they automatically appear as display options in the UI.
- **Real-Time Data:** Workstation metrics (OEE, Orders, Status) refresh automatically every 10 seconds.
- **Interactive Canvas:** High-performance canvas rendering for complex factory layouts.
- **Admin Dashboard:** Full control over factory structure and parameters.

---

## 🛠 Prerequisites
- **Node.js:** v18 or later.
- **SQL Server:** 2019 or later (Express version is fine).
- **SSMS:** SQL Server Management Studio.

---

## 🏗 Setup Instructions

### 1. Database Setup (SSMS)
1. Open SSMS and run the following script to create the database and tables:

```sql
CREATE DATABASE FactoryDynamicDB;
GO
USE FactoryDynamicDB;
GO

-- Main Parameter Table
CREATE TABLE WORKSTATION_Parameters (
    WS_Parameter_ID INT IDENTITY(1,1) PRIMARY KEY,
    WS_ID VARCHAR(50) NOT NULL,
    OEE FLOAT,
    Orders VARCHAR(100),
    Status VARCHAR(50)
);
GO

-- Add all 27 Workstations
INSERT INTO WORKSTATION_Parameters (WS_ID, OEE, Orders, Status) VALUES 
('w1', 92, 'ORD-001', 'Running'), ('w2', 88, 'ORD-002', 'Running'),
('w3', 85, 'ORD-003', 'Idle'), ('w4', 91, 'ORD-004', 'Running'),
('w5', 78, 'ORD-005', 'Bottleneck'), ('w6', 82, 'ORD-006', 'Running'),
('w7', 95, 'ORD-007', 'Running'), ('w8', 89, 'ORD-008', 'Idle'),
('w9', 90, 'ORD-009', 'Running'), ('w10', 94, 'ORD-010', 'Running'),
('w11', 88, 'ORD-011', 'Running'), ('w12', 86, 'ORD-012', 'Running'),
('w13', 91, 'ORD-013', 'Running'), ('w14', 93, 'ORD-014', 'Running'),
('w15', 60, 'None', 'Down'), ('w16', 83, 'ORD-016', 'Idle'),
('w17', 87, 'ORD-017', 'Running'), ('w18', 84, 'ORD-018', 'Running'),
('w19', 92, 'ORD-019', 'Running'), ('w20', 91, 'ORD-020', 'Running'),
('w21', 89, 'ORD-021', 'Running'), ('w22', 92, 'ORD-022', 'Running'),
('w23', 85, 'ORD-023', 'Idle'), ('w24', 93, 'ORD-024', 'Running'),
('w25', 75, 'ORD-025', 'Critical'), ('w26', 94, 'ORD-026', 'Running'),
('w27', 91, 'ORD-027', 'Running');
GO
```

### 2. Backend Setup
1. Navigate to the `backend` folder.
2. Create a `.env` file:
   ```env
   DB_SERVER=localhost
   DB_DATABASE=FactoryDynamicDB
   DB_USER=factory_admin
   DB_PASSWORD=Factory123!
   DB_WINDOWS_AUTH=false
   PORT=4000
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the server:
   ```bash
   npm run dev
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` folder.
2. Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:4000/api
   ```
3. Install dependencies:
   ```bash
   npm install --legacy-peer-deps
   ```
4. Start the application:
   ```bash
   npm run dev
   ```
5. Open [http://localhost:3000/admin/editor?id=three-assemblies-v1](http://localhost:3000/admin/editor?id=three-assemblies-v1)

---

## 📈 How to Add New Parameters
1. Add a new column to the `WORKSTATION_Parameters` table in SSMS.
2. Refresh the frontend. 
3. The backend automatically detects the new column, updates the configuration XML, and the frontend renders the new parameter in the sidebar!

---

## 👥 Contributors
- Project maintained by Capgemini Team.
