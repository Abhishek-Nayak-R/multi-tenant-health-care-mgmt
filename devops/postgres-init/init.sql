-- Create schemas for tenant isolation
CREATE SCHEMA IF NOT EXISTS tenant_a;
CREATE SCHEMA IF NOT EXISTS tenant_b;

-- Create Patients table in tenant_a
CREATE TABLE IF NOT EXISTS tenant_a.patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    medical_record_number VARCHAR(50) NOT NULL UNIQUE,
    diagnosis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create Patients table in tenant_b
CREATE TABLE IF NOT EXISTS tenant_b.patients (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL,
    medical_record_number VARCHAR(50) NOT NULL UNIQUE,
    diagnosis TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Seed data for Tenant A (Alpha Clinic)
INSERT INTO tenant_a.patients (name, email, phone, medical_record_number, diagnosis) 
VALUES 
('John Doe', 'john.doe@email.com', '123-456-7890', 'MRN-A-1001', 'Hypertension - monitor blood pressure daily'),
('Alice Smith', 'alice.smith@email.com', '123-456-7891', 'MRN-A-1002', 'Seasonal allergies - prescribed Cetirizine');

-- Seed data for Tenant B (Beta Hospital)
INSERT INTO tenant_b.patients (name, email, phone, medical_record_number, diagnosis) 
VALUES 
('Robert Johnson', 'robert.j@email.com', '987-654-3210', 'MRN-B-2001', 'Type 2 Diabetes - Metformin 500mg'),
('Emma Watson', 'emma.w@email.com', '987-654-3211', 'MRN-B-2002', 'Asthma - Albuterol inhaler as needed');
