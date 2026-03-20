.PHONY: install setup db-push db-seed dev server clean

# Install dependencies
install:
	npm install

# Setup: install deps + push schema + seed database
setup: install db-push db-seed
	@echo "✅ Setup complete! Run 'make dev' to start servers"

# Push database schema
db-push:
	npm run db:push

# Seed database with test data
db-seed:
	npm run db:seed

# Start Next.js dev server (HTTP API + WebSocket)
dev:
	npm run dev

# Start standalone TCP + WebSocket server
server:
	npm run server

# Clean build artifacts
clean:
	rm -rf .next node_modules

# Run all servers (requires separate terminals)
help:
	@echo "Available commands:"
	@echo "  make install    - Install dependencies"
	@echo "  make setup      - Full setup (install + db-push + seed)"
	@echo "  make db-push    - Push database schema"
	@echo "  make db-seed    - Seed database with test data"
	@echo "  make dev        - Start Next.js dev server"
	@echo "  make server     - Start TCP + WebSocket server"
	@echo "  make clean      - Clean build artifacts"
