#!/bin/bash

# Initialize flags
local_backup=false
remote_backup=false

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        --local)
            local_backup=true
            shift
            ;;
        --remote)
            remote_backup=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# If no flags were specified, perform both backups
if [ "$local_backup" = false ] && [ "$remote_backup" = false ]; then
    local_backup=true
    remote_backup=true
fi

# Create backup directories if they don't exist
mkdir -p backup/local
mkdir -p backup/remote

# Generate timestamp for filename
timestamp=$(date +"%Y%m%d%H%M")

# Function to perform backup
perform_backup() {
    local type=$1
    local output_file="backup/${type}/${timestamp}.sql"
    
    echo "Performing ${type} backup..."
    npx wrangler d1 export meic-feedback --${type} --output="${output_file}"
    
    if [ $? -eq 0 ]; then
        echo "Backup completed successfully: ${output_file}"
    else
        echo "Backup failed!"
        exit 1
    fi
}

# Perform backups based on flags
if [ "$local_backup" = true ]; then
    perform_backup "local"
fi

if [ "$remote_backup" = true ]; then
    perform_backup "remote"
fi

echo "Backup process completed!"
