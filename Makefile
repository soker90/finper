define help

  Usage: make <command>

  Commands:

    build-api:                 build the API
    build-client:              build the client
    build-image-api-daily:     build the API image dev
    build-image-api-latest:    build the API image latest
    build-types:               build the shared types
    build-db:                  build the database package
    install:                   install all dependencies.
    lint-api:                  lint the API
    lint-bot:                  lint the bot
    lint-client:               lint the client
    lint-db:                   lint the database package
    lint-types:                lint the shared types.
    seed-user:                 create initial user (USERNAME and PASSWORD required).
    test:                      run all tests.
    test-api:                  run all tests for the API.
    test-bot:                  run tests for the bot.
    test-client:               run all tests for the client
    test-db:                   run all tests for the database package.
    test-types:                run all tests for the shared types.
    start-api:                 launch api
    start-bot:                 launch bot (Cloudflare Worker dev)
    start-client:              launch client
    deploy-bot:                deploy bot to Cloudflare Workers
    type-check-bot:            typecheck the bot
    clean:                     clean all build artifacts.

endef
export help

help:
	@echo "$$help"

install:
	@pnpm install

test:
	@pnpm -r --parallel test

## Types ##
build-types:
	@pnpm --filter @soker90/finper-types build

test-types:
	@pnpm --filter @soker90/finper-types test

lint-types:
	@pnpm --filter @soker90/finper-types lint

## DB ##
build-db:
	@pnpm --filter @soker90/finper-db build

test-db:
	@pnpm --filter @soker90/finper-db test

lint-db:
	@pnpm --filter @soker90/finper-db lint

## API ##
seed-user:
	@INIT_USERNAME=$(USERNAME) INIT_PASSWORD=$(PASSWORD) pnpm --filter @soker90/finper-api seed-user

start-api:
	@pnpm --filter @soker90/finper-api start

test-api:
	@pnpm --filter @soker90/finper-api test

build-api: build-types build-db
	@pnpm --filter @soker90/finper-api build

lint-api:
	@pnpm --filter @soker90/finper-api lint

# temporal
build-image-api-daily:
	@docker build . -t soker90/finper-api:daily -f ./packages/api/Dockerfile
	@docker push soker90/finper-api:daily

build-image-api-latest:
	@docker build . -t soker90/finper-api:latest -f ./packages/api/Dockerfile
	@docker push soker90/finper-api:latest

## Bot ##
start-bot:
	@pnpm --filter @soker90/finper-bot dev

deploy-bot:
	@pnpm --filter @soker90/finper-bot deploy

lint-bot:
	@pnpm --filter @soker90/finper-bot lint

type-check-bot:
	@pnpm --filter @soker90/finper-bot type-check

## Frontend ##
start-client:
	@pnpm --filter @soker90/finper-client dev

test-client:
	@pnpm --filter @soker90/finper-client test

build-client:
	@pnpm --filter @soker90/finper-client build

lint-client:
	@pnpm --filter @soker90/finper-client lint

build-image-client-daily:
	@docker build . -t soker90/finper-client:daily -f ./packages/client/Dockerfile
	@docker push soker90/finper-client:daily

build-image-client-latest:
	@docker build . -t soker90/finper-client:latest -f ./packages/client/Dockerfile
	@docker push soker90/finper-client:latest

.PHONY: clean
clean:
	rm -rf packages/*/dist packages/*/coverage packages/*/node_modules
