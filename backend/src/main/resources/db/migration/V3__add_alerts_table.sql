-- V3__add_alerts_table.sql

CREATE TABLE IF NOT EXISTS usage_alerts (
                                            id BIGSERIAL PRIMARY KEY,
                                            household_id BIGINT NOT NULL,
                                            alert_type VARCHAR(50) NOT NULL,
    message VARCHAR(500) NOT NULL,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
                             CONSTRAINT fk_alert_household FOREIGN KEY (household_id) REFERENCES households (id) ON DELETE CASCADE
    );