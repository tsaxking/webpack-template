#!/bin/bash

set -e

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to detect OS
detect_os() {
    if command_exists lsb_release; then
        os_name=$(lsb_release -is)
        os_version=$(lsb_release -rs)
    elif [ -f /etc/os-release ]; then
        . /etc/os-release
        os_name=$NAME
        os_version=$VERSION_ID
    else
        echo "Unable to detect OS. Please install dependencies manually."
        exit 1
    fi
}

# Detect OS
detect_os

# Install dependencies based on OS
install_dependencies() {
    case $os_name in
        Ubuntu)
            if [ "$(echo "$os_version < 24.04" | bc)" -eq 1 ]; then
                sudo apt-get update && sudo apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
            else
                sudo apt-get update && sudo apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
            fi
            ;;
        Debian)
            sudo apt-get update && sudo apt-get install -y libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
            ;;
        "Arch Linux")
            sudo pacman -Syu --noconfirm gtk2 gtk3 alsa-lib xorg-server-xvfb libxss nss libnotify
            ;;
        *)
            echo "Unsupported OS: $os_name. Please install dependencies manually."
            exit 1
            ;;
    esac
}

# Install dependencies
echo "Installing dependencies for $os_name $os_version"
install_dependencies

# Install or update Cypress
echo "Installing/updating Cypress"
if ! npm list cypress --depth=0 >/dev/null 2>&1; then
    npm install cypress --save-dev
else
    npm update cypress
fi

echo "Cypress setup completed successfully!"
