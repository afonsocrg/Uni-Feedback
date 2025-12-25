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
    echo "1) Start the database (pnpm run start)"
    echo "2) Check database status"
    echo "3) Continue anyway (might fail)"
    echo "4) Exit"
    echo ""
    read -p "Choose option (1-4): " choice

    case $choice in
        1)
            echo "Starting database..."
            pnpm run start
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

# Check database connection first
if ! check_database; then
    if ! prompt_database_start; then
        exit 1
    fi
fi

# Run migration
echo ""
echo "Running database migration..."

if dotenv -- drizzle-kit migrate; then
    echo "✅ Migration completed successfully!"
else
    echo "❌ Migration failed!"
    echo "Common issues:"
    echo "- Database not running (try: pnpm start)"
    echo "- Database connection issues"
    echo "- Migration file errors"
    echo "- Database permission issues"
    exit 1
fi