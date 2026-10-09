-- ============================================================
-- PRN232 Practical Exam 2 (Assignment 2) Migration
-- Tables: SystemAccount, Audit fields for Project and Task
-- ============================================================

CREATE TABLE IF NOT EXISTS "SystemAccount" (
    "AccountID"             SERIAL          PRIMARY KEY,
    "FullName"              VARCHAR(150)    NOT NULL,
    "Email"                 VARCHAR(150)    NOT NULL UNIQUE,
    "PasswordHash"          VARCHAR(255)    NOT NULL,
    "Role"                  SMALLINT        NOT NULL DEFAULT 0, -- 0 = Staff, 1 = Admin
    "CreatedDate"           TIMESTAMP       NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "RefreshToken"          VARCHAR(255)    NULL,
    "RefreshTokenExpiry"    TIMESTAMP       NULL
);

-- Bonus: Audit fields linking actions to SystemAccount
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "CreatedByID" INT NULL REFERENCES "SystemAccount" ("AccountID");
ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "UpdatedByID" INT NULL REFERENCES "SystemAccount" ("AccountID");

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "CreatedByID" INT NULL REFERENCES "SystemAccount" ("AccountID");
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "UpdatedByID" INT NULL REFERENCES "SystemAccount" ("AccountID");

-- Seed Admin Account (Password: Admin@123456) and Staff Account (Password: Staff@123456)
INSERT INTO "SystemAccount" ("FullName", "Email", "PasswordHash", "Role")
VALUES 
    ('System Administrator', 'admin@tasktrack.com', '$2a$11$SqJUa2j630P1Q6VFtRqnTudFoB.aHky2j0Sx3tAnbYUxhdjPhHOge', 1),
    ('Default Staff', 'staff@tasktrack.com', '$2a$11$AleJVumLbVb4vImcfN36f.x8mJL.ju7P0b.FYB/m5fZgV1djzoxJ6', 0)
ON CONFLICT ("Email") DO NOTHING;
