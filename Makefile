define help

  Usage: make <command>

  Commands:

    build-api:                 build the API
    build-client:              build the client
    build-image-api-daily:     build the API image dev
    build-image-api-latest:    build the API image latest
    build-models:              build the models
    install:                   install all dependencies.
    lint-api:                  lint the API
    lint-client:               lint the client
    lint-models:               lint the models.
    test:                      run all tests.
    test-api:                  run all tests for the API.
    test-client:               run all tests for the client
    test-models:               run all tests for the models.
    start-api:                 launch api
    start-client:              launch client

endef
export help

help:
	@echo "$$help"

install:
	@pnpm install

test:
	@pnpm -r --parallel test

## Models ##
build-models:
	@pnpm --filter @soker90/finper-models build

test-models:
	@pnpm --filter @soker90/finper-models test

lint-models:
	@pnpm --filter @soker90/finper-models lint

## API ##
start-api:
	@pnpm --filter @soker90/finper-api start

test-api:
	@pnpm --filter @soker90/finper-api test

build-api:
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