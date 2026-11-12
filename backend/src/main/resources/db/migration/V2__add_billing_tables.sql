-- V2__add_billing_tables.sql

-- 1. Bulk Water Purchases Table (For Tankers/Municipal Supply tracking)
CREATE TABLE IF NOT EXISTS bulk_water_purchases (
                                                    id BIGSERIAL PRIMARY KEY,
                                                    apartment_id BIGINT NOT NULL,
                                                    billing_cycle_id BIGINT NOT NULL,
                                                    purchase_date DATE NOT NULL,
                                                    volume_kl NUMERIC(10, 2) NOT NULL,
    total_cost NUMERIC(12, 2) NOT NULL,
    vendor_name VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                             CONSTRAINT fk_purchase_apartment FOREIGN KEY (apartment_id) REFERENCES apartments (id) ON DELETE CASCADE,
    CONSTRAINT fk_purchase_cycle FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles (id) ON DELETE CASCADE
    );

-- 2. Invoices Table (Generated per household per billing cycle)
CREATE TABLE IF NOT EXISTS invoices (
                                        id BIGSERIAL PRIMARY KEY,
                                        household_id BIGINT NOT NULL,
                                        billing_cycle_id BIGINT NOT NULL,
                                        invoice_number VARCHAR(100) NOT NULL UNIQUE,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    consumption_kl NUMERIC(10, 3) NOT NULL,
    metered_charge NUMERIC(10, 2) NOT NULL,
    shared_area_charge NUMERIC(10, 2) NOT NULL,
    total_amount NUMERIC(10, 2) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UNPAID',
    pdf_path TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                             CONSTRAINT fk_invoice_household FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE,
    CONSTRAINT fk_invoice_cycle FOREIGN KEY (billing_cycle_id) REFERENCES billing_cycles (id) ON DELETE CASCADE,
    CONSTRAINT uk_household_cycle UNIQUE (household_id, billing_cycle_id)
    );