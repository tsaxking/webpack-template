#!/bin/bash

# Load environment variables
eval "$(
  cat .env | awk '!/^\s*#/' | awk '!/^\s*$/' | while IFS='' read -r line; do
    key=$(echo "$line" | cut -d '=' -f 1 | awk '{$1=$1;print}')
    value=$(echo "$line" | cut -d '=' -f 2- | awk '{$1=$1;gsub("\047", "\042", $0);print}')
    echo "export $key=\"$value\""
  done
)"

# Check if PostgreSQL is installed
check_postgres() {
    if ! command -v psql &>/dev/null; then
        echo "PostgreSQL is not installed."
        install_postgres
    else
        echo "PostgreSQL is already installed."
    fi
}

# Function to install PostgreSQL based on the distribution
install_postgres() {
    distro=$(awk -F= '/^NAME/{print $2}' /etc/os-release)
    case "$distro" in
        *"Arch"*)
            echo "Detected Arch Linux, installing PostgreSQL..."
            sudo pacman -Sy postgresql --noconfirm
            ;;
        *"Debian"*)
            echo "Detected Debian-based system, installing PostgreSQL..."
            sudo apt-get update
            sudo apt-get install postgresql -y
            ;;
            # Wsl
        *"Ubuntu"*)
            echo "Detected Ubuntu-based system, installing PostgreSQL..."
            sudo apt-get update
            sudo apt-get install postgresql -y
            ;;
        *)
            echo "Unsupported distribution. Please install PostgreSQL manually."
            exit 1
            ;;
    esac
}

# Function to create user and database
setup_db() {
    echo "Creating user and database."
    sudo su - postgres -c "psql -c \"CREATE ROLE admin WITH NOLOGIN;\""
    sudo su - postgres -c "psql -c \"CREATE ROLE $DATABASE_USER WITH LOGIN;\""
    sudo su - postgres -c "psql -c \"ALTER ROLE $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';\""
    sudo su - postgres -c "psql -c \"GRANT admin TO $DATABASE_USER;\""
    sudo su - postgres -c "psql -c \"CREATE DATABASE $DATABASE_NAME with OWNER $DATABASE_USER;\""
}

# Check for force-reset argument
if [[ "$1" == "--force-reset" ]]; then
    echo "Creating backup, if exists."
    sudo su - postgres -c "pg_dump $DATABASE_NAME > /tmp/$DATABASE_NAME.sql"

    echo "Dropping existing database."
    sudo su - postgres -c "psql -c \"DROP DATABASE IF EXISTS $DATABASE_NAME;\""
    sudo su - postgres -c "psql -c \"DROP ROLE IF EXISTS $DATABASE_USER;\""
fi

if [[ "$1" == "--create-only" ]]; then
    echo "Creating database only."
    setup_db
else
    check_postgres
    echo "Starting up PostgreSQL."
    sudo systemctl start postgresql
    # Setup database
    setup_db
    sudo service postgresql restart
fi

exit 0
