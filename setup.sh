#!/bin/bash

echo "🚀 Setting up shared database configuration for Uni Feedback..."

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_step() {
    echo -e "${BLUE}[SETUP]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠️${NC} $1"
}

# Step 1: Remove existing .wrangler directories from apps
print_step "Removing existing .wrangler directories from apps..."

if [ -d "apps/api/.wrangler" ]; then
    rm -rf apps/api/.wrangler
    print_success "Removed apps/api/.wrangler"
else
    print_warning "apps/api/.wrangler doesn't exist, skipping"
fi

if [ -d "apps/ssg-website/.wrangler" ]; then
    rm -rf apps/ssg-website/.wrangler
    print_success "Removed apps/ssg-website/.wrangler"
else
    print_warning "apps/ssg-website/.wrangler doesn't exist, skipping"
fi

# Step 2: Create symbolic links to shared database
print_step "Creating symbolic links to shared database..."

# Create symlink from API to shared database
cd apps/api
ln -sf ../../packages/database/.wrangler .wrangler
cd ../..
print_success "Created symlink: apps/api/.wrangler → packages/database/.wrangler"

# Create symlink from SSG website to shared database
cd apps/ssg-website
ln -sf ../../packages/database/.wrangler .wrangler
cd ../..
print_success "Created symlink: apps/ssg-website/.wrangler → packages/database/.wrangler"

# Step 3: Verify symlinks
print_step "Verifying symbolic links..."

if [ -L "apps/api/.wrangler" ]; then
    print_success "API symlink created successfully"
else
    echo -e "${RED}❌${NC} Failed to create API symlink"
    exit 1
fi

if [ -L "apps/ssg-website/.wrangler" ]; then
    print_success "SSG website symlink created successfully"
else
    echo -e "${RED}❌${NC} Failed to create SSG website symlink"
    exit 1
fi

# Step 4: Check if database exists
print_step "Checking database status..."

if [ -d "packages/database/.wrangler/state/v3/d1" ]; then
    db_files=$(find packages/database/.wrangler/state/v3/d1 -name "*.sqlite" 2>/dev/null | wc -l)
    if [ $db_files -gt 0 ]; then
        print_success "Database files found: $db_files SQLite database(s)"
    else
        print_warning "No database files found. You may need to run migrations or start the development server."
    fi
else
    print_warning "Database directory doesn't exist yet. It will be created when you first run a development server."
fi

echo ""
echo -e "${GREEN}🎉 Database setup complete!${NC}"
echo ""
echo "Both the API and SSG website now share the same local D1 database."
echo "Any data changes in one app will be immediately visible in the other."
echo ""
echo "Next steps:"
echo "  1. Run 'bun run dev' to start all development servers"
echo "  2. The first time you start, migrations will run automatically"
echo "  3. Both apps will use the same database instance"