#!/bin/bash

echo "Initializing database..."
echo "Arguments: $@"

# Assume format is --user=USER --password=PASSWORD --database=DATABASE
# for i in "$@"
# do
#     case $i in
#         --user=*)
#             DATABASE_USER="${i#*=}"
#             shift
#             ;;
#         --password=*)
#             DATABASE_PASSWORD="${i#*=}"
#             shift
#             ;;
#         --database=*)
#             DATABASE_NAME="${i#*=}"
#             shift
#             ;;
#         *)
#         #     echo "Invalid argument: $i"
#         #     exit 1
#         #     ;;
#         # --force-reset)
#         #     shift
#         #     ;;
#     esac
# done

# Parse arguments
# assume --name=DATABASE_NAME --user=DATABASE_USER --password=DATABASE_PASSWORD
while [[ "$#" -gt 0 ]]; do
    case $1 in
        --database=*) DATABASE_NAME="${1#*=}" ;;
        --user=*) DATABASE_USER="${1#*=}" ;;
        --password=*) DATABASE_PASSWORD="${1#*=}" ;;
        # --force-reset) FORCE_RESET=true ;;
        *) echo "Unknown parameter passed: $1"; usage ;;
    esac
    shift
done

echo "Database name: $DATABASE_NAME"
echo "Database user: $DATABASE_USER"
echo "Database password: $DATABASE_PASSWORD"

# Load environment variables
# eval "$(
#   cat .env | awk '!/^\s*#/' | awk '!/^\s*$/' | while IFS='' read -r line; do
#     key=$(echo "$line" | cut -d '=' -f 1 | awk '{$1=$1;print}')
#     value=$(echo "$line" | cut -d '=' -f 2- | awk '{$1=$1;gsub("\047", "\042", $0);print}')
#     echo "export $key=\"$value\""
#   done
# )"

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

# Check if PostgreSQL is installed
if ! command -v psql &>/dev/null; then
    install_postgres
else
    echo "PostgreSQL is already installed."
fi

# Start PostgreSQL service
echo "Starting postgresql service."
sudo systemctl start postgresql

if $1 == "--force-reset"; then
    echo "Creating backup, if exists."
    sudo su - postgres -c "pg_dump $DATABASE_NAME > /tmp/$DATABASE_NAME.sql"

    echo "Dropping existing database."
    sudo su - postgres -c "psql -c \"DROP DATABASE IF EXISTS $DATABASE_NAME;\""
    sudo su - postgres -c "psql -c \"DROP ROLE IF EXISTS $DATABASE_USER;\""
fi

echo "Creating user and database."
sudo su - postgres -c "psql -c \"CREATE ROLE admin WITH NOLOGIN;\""
sudo su - postgres -c "psql -c \"CREATE ROLE $DATABASE_USER WITH LOGIN;\""
sudo su - postgres -c "psql -c \"ALTER ROLE $DATABASE_USER WITH PASSWORD '$DATABASE_PASSWORD';\""
sudo su - postgres -c "psql -c \"GRANT admin TO $DATABASE_USER;\""
sudo su - postgres -c "psql -c \"CREATE DATABASE $DATABASE_NAME with OWNER $DATABASE_USER;\""

sudo service postgresql restart
exit 0