create table if not exists accounts (
    id text primary key,
    username text unique not null,
    key text not null,
    salt text not null,
    first_name text not null,
    last_name text not null,
    email text not null unique,
    password_change text,
    picture text,
    verified integer not null default 0,
    verification text,
    email_change text,
    password_change_date bigint,
    phone_number text,
    created bigint not null
);


create table if not exists members (
    id text primary key,
    title text,
    status text default 'pending',
    bio text,
    resume text,
    board integer not null default 0
);


create table if not exists roles (
    id text primary key,
    name text not null,
    description text,
    rank integer not null
);


create table if not exists account_roles (
    account_id text not null,
    role_id text not null
);

create table if not exists permissions (
    permission text not null,
    description text
);

create table if not exists role_permissions (
    role_id text not null,
    permission text not null
);


-- create table if not exists limit (
--     ip text primary key,
--     limit_start integer not null,
--     limit_time integer not null
-- );


create table if not exists version (
    major integer not null default 1,
    minor integer not null default 0,
    patch integer not null default 0
);


create table if not exists sessions (
    id text primary key,
    account_id text,
    ip text,
    user_agent text,
    latest_activity bigint,
    requests integer not null default 0,
    created bigint not null,
    prev_url text
);

create table if not exists account_settings (
    account_id text not null primary key,
    settings text not null -- json
);

-- create table if not exists block_list (
--     ip text primary key,
--     created integer not null
-- );



-- reset the version number
delete from version;

insert into version (
    major,
    minor,
    patch
) values (
    1,
    0,
    0
);