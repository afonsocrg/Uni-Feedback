#!/bin/bash

# Function to check if database is accessible
check_database() {
    echo "Checking database connection..."
    if dotenv -- psql -h localhost -p 5433 -U postgres -d uni-feedback -c "SELECT 1;" > /dev/null 2>&1; then
        return 0
    else
        return 1
    fi
}

# Function to prompt user about database
prompt_database_start() {
    echo ""
    echo "❌ Database connection failed!"
    echo ""
    echo "The database might not be running. Would you like to:"
    echo "1) Start the database (bun run start)"
    echo "2) Check database status"
    echo "3) Continue anyway (might fail)"
    echo "4) Exit"
    echo ""
    read -p "Choose option (1-4): " choice

    case $choice in
        1)
            echo "Starting database..."
            bun run start
            sleep 3
            if check_database; then
                echo "✅ Database is now running!"
                return 0
            else
                echo "❌ Database still not accessible. Please check manually."
                return 1
            fi
            ;;
        2)
            echo "Checking database status..."
            docker ps | grep -E "(uni-feedback|postgres)" || echo "No database containers found"
            return 1
            ;;
        3)
            echo "Continuing anyway..."
            return 0
            ;;
        4)
            echo "Exiting..."
            exit 0
            ;;
        *)
            echo "Invalid option. Exiting..."
            exit 1
            ;;
    esac
}

# Prompt for migration name
echo "Enter migration name (or press Enter for auto-generated name):"
read migration_name

# Check database connection first
if ! check_database; then
    if ! prompt_database_start; then
        exit 1
    fi
fi

# Generate migration
echo ""
echo "Generating migration..."

if [ -z "$migration_name" ]; then
    # No name provided, use default
    if dotenv -- drizzle-kit generate; then
        echo "✅ Migration generated successfully!"
    else
        echo "❌ Migration generation failed!"
        echo "Common issues:"
        echo "- Database not running (try: bun run start)"
        echo "- Database connection issues"
        echo "- Schema compilation errors"
        exit 1
    fi
else
    # Use provided name
    if dotenv -- drizzle-kit generate --name "$migration_name"; then
        echo "✅ Migration '$migration_name' generated successfully!"
    else
        echo "❌ Migration generation failed!"
        echo "Common issues:"
        echo "- Database not running (try: bun run start)"
        echo "- Database connection issues"
        echo "- Schema compilation errors"
        exit 1
    fi
fi