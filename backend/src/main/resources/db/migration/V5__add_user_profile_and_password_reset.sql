ALTER TABLE users
    ADD COLUMN phone_number VARCHAR(20),
ADD COLUMN profile_photo_url VARCHAR(500);

CREATE TABLE password_reset_tokens (
                                       id BIGSERIAL PRIMARY KEY,
                                       token VARCHAR(255) NOT NULL UNIQUE,
                                       user_id BIGINT NOT NULL,
                                       expiry_date TIMESTAMP WITH TIME ZONE NOT NULL,
                                       CONSTRAINT fk_prt_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);