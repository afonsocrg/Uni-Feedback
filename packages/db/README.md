# Uni Feedback Database (Postgres)

This package contains 



#### Docker Setup Issues

**Problem**: When running `bun db:start` or `docker-compose up -d`, you get errors like:
- `Cannot connect to the Docker daemon at unix:///Users/afonsocrg/.colima/default/docker.sock. Is the docker daemon running?`

**Solution**:

1. **Install Docker and Colima** (if not already installed):
   ```bash
   # Install via Homebrew
   brew install docker colima
   ```

2. **Start Colima** (Docker daemon for macOS):
   ```bash
   colima start
   ```

3. **Verify Docker is working**:
   ```bash
   docker ps
   ```

4. **Start the database**:
   ```bash
   # Use bun (recommended)
   bun db:start

   # Or use docker-compose directly
   docker-compose up -d
   ```

5. **Check container status**:
   ```bash
   docker ps
   ```

#### Optional: Auto-start Colima on Boot

To avoid manually starting Colima after each restart, you can enable auto-start:

```bash
# Enable Colima to start automatically on login
brew services start colima

# Verify it's enabled
brew services list | grep colima
```

If you prefer manual control, you can disable auto-start:
```bash
brew services stop colima
```

**Note**: If auto-start is not enabled, you'll need to run `colima start` after each restart before using Docker commands.