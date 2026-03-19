.PHONY: up down seed logsserver logsnapi logsdb help

help:
	@echo "Fleet Pulse - Available Commands:"
	@echo "  make up         Start all services (Docker + Next.js + TCP/WS)"
	@echo "  make down       Stop all services"
	@echo "  make seed       Initialize and seed the database"
	@echo "  make server     Run the standalone TCP/WS server"
	@echo "  make dev        Run the Next.js development server"
	@echo "  make stress     Run the manual stress test (NC simulation)"

up:
	docker-compose up -d
	npm install
	npx prisma generate
	npm run dev & npm run server

down:
	docker-compose down

seed:
	npx prisma db push
	npm run db:seed

server:
	npm run server

dev:
	npm run dev

stress:
	@echo "Sending test ping..."
	echo "PING,354678901234561,18.5204,73.8567,42.5,1" | nc localhost 5000
