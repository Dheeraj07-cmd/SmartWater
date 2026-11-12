CREATE TABLE IF NOT EXISTS announcements (
                                             id BIGSERIAL PRIMARY KEY,
                                             title VARCHAR(200) NOT NULL,
    description VARCHAR(1000) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
    );