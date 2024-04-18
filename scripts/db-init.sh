#!/bin/bash

# Load environment variables
eval "$(
  cat ../.env | awk '!/^\s*#/' | awk '!/^\s*$/' | while IFS='' read -r line; do
    key=$(echo "$line" | cut -d '=' -f 1 | awk '{$1=$1;print}')
    value=$(echo "$line" | cut -d '=' -f 2- | awk '{$1=$1;gsub("\047", "\042", $0);print}')
    echo "export $key=\"$value\""
  done
)"

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
        *)
            echo "Unsupported distribution. Please install PostgreSQL manually."
            exit 1
            ;;
    esac
}

# Check if PostgreSQL is installed
if ! command -v psql &>/dev/null; then
    install_postgres
else
    echo "PostgreSQL is already installed."
fi

# Start PostgreSQL service
echo "Starting postgresql service."
sudo systemctl start postgresql

# Run psql as the postgres user
echo "Creating user and database."
sudo -u postgres psql <<EOF

-- Create role 'admin' with NOLOGIN
CREATE ROLE "admin" WITH NOLOGIN;

-- Create role with the provided username from environment variable
CREATE ROLE $DATABASE_USER WITH LOGIN; 
ALTER ROLE $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';

-- Grant admin privileges to the user
GRANT admin TO $DATABASE_USER;

-- Create the database with the provided name from environment variable
CREATE DATABASE $DATABASE_NAME with OWNER $DATABASE_USER;

EOF
