#!/bin/bash

# SQL utility script
# Usage: bun sql "SELECT * FROM users;"
# Usage: bun sql -f filename.sql

if [ $# -eq 0 ]; then
    echo "Usage:"
    echo "  pnpm sql \"SQL_STATEMENT\"          - Execute SQL statement"
    echo "  pnpm sql -f filename.sql           - Execute SQL file"
    echo ""
    echo "Examples:"
    echo "  pnpm sql \"SELECT * FROM faculties;\""
    echo "  pnpm sql -f update_slugs_contextual.sql"
    exit 1
fi

# Check if it's a file execution
if [ "$1" = "-f" ]; then
    if [ -z "$2" ]; then
        echo "Error: No filename provided after -f"
        exit 1
    fi

    if [ ! -f "$2" ]; then
        echo "Error: File '$2' not found"
        exit 1
    fi

    echo "Executing SQL file: $2"
    dotenv -- psql -h localhost -p 5433 -U postgres -d uni-feedback -f "$2"
else
    # Execute SQL statement directly
    echo "Executing SQL: $1"
    dotenv -- psql -h localhost -p 5433 -U postgres -d uni-feedback -c "$1"
fi