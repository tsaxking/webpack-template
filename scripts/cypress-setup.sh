#!/bin/bash

# Check if the script is running under bash or dash
if [ -z "$BASH_VERSION" ]; then
    echo "This script needs to be run with bash."
    echo "Attempting to re-run using bash..."
    chmod u+x scripts/cypress-setup.sh
    echo "Use chmod u+x scripts/cypress-setup.sh if this does not work"
    echo "then run ./scripts/cypress-setup.sh"
    sleep 3
    ./scripts/cypress-setup.sh
    exit 1
fi

# Get the operating system information
os_name=$(lsb_release -is)
ubuntu_version=$(lsb_release -rs)

if [[ "$os_name" == "Ubuntu" ]]; then
    # If Ubuntu, check the version
    if [[ "$(echo "$ubuntu_version < 24.04" | bc)" -eq 1 ]]; then
        # Ubuntu < 24.04
        sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
    else
        # Ubuntu 24.04
        sudo apt-get install libgtk2.0-0t64 libgtk-3-0t64 libgbm-dev libnotify-dev libnss3 libxss1 libasound2t64 libxtst6 xauth xvfb
    fi
elif [[ "$os_name" == "Debian" ]]; then
    # Debian
    sudo apt-get install libgtk2.0-0 libgtk-3-0 libgbm-dev libnotify-dev libnss3 libxss1 libasound2 libxtst6 xauth xvfb
elif grep -q 'Arch Linux' /etc/os-release; then
    # Arch Linux
    sudo pacman -S gtk2 gtk3 alsa-lib xorg-server-xvfb libxss nss libnotify
else
    # Other OS (amazon linux, freebsd, macOS, etc.)
    echo "Unknown OS"
fi

# Check if Cypress is actually installed
npm install cypress --save-dev
