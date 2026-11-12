CREATE TABLE IF NOT EXISTS support_tickets (
                                               id BIGSERIAL PRIMARY KEY,
                                               resident_id BIGINT NOT NULL,
                                               issue_type VARCHAR(100) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'OPEN',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE,
                             CONSTRAINT fk_support_ticket_resident FOREIGN KEY (resident_id) REFERENCES users (id) ON DELETE CASCADE
    );