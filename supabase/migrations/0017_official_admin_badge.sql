-- Distinguishes the platform's official/verified admin account from any
-- other manually-seeded admin — drives the blue shield badge in the UI.
alter table profiles add column is_official_admin boolean not null default false;
