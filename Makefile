
define help

  Usage: make <command>

  Commands:

    install:                    install all dependencies.
    start-api:                  launch api

endef
export help

help:
	@echo "$$help"

install:
	@npm i

test:
	@npm test

 ## Models ##
build-models:
	@npm run build --workspace=@soker90/finper-models

test-models:
	@npm run test --workspace=@soker90/finper-models

lint-models:
	@npm run lint --workspace=@soker90/finper-models

## API ##
start-api:
	@npm run start --workspace=@soker90/finper-api

test-api:
	@npm test --workspace=@soker90/finper-api

build-api:
	@npm run build --workspace=@soker90/finper-api

lint-api:
	@npm run lint --workspace=@soker90/finper-api

# temporal
build-image-api-daily:
	@docker build ./packages/api -t soker90/finper-api:daily -f ./packages/api/Dockerfile
	@docker push soker90/finper-api:daily

build-image-api-latest:
	@docker build ./packages/api -t soker90/finper-api:latest -f ./packages/api/Dockerfile
	@docker push soker90/finper-api:latest

## Frontend ##
start-client:
	@npm run dev --workspace=@soker90/finper-client

test-client:
	@npm test --workspace=@soker90/finper-client

build-client:
	@npm run build --workspace=@soker90/finper-client

lint-client:
	@npm run lint --workspace=@soker90/finper-client