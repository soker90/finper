
define help

  Usage: make <command>

  Commands:

	build-api:	                build the API
	build-client:	            build the client
	build-image-api-daily:	    build the API image dev
	build-image-api-latest:	    build the API image latest
	build-models:				build the models
    install:                    install all dependencies.
    lint-api:                   lint the API
    lint-client:                lint the client
    lint-models:                lint the models.
    test:                       run all tests.
    test-api:                   run all tests for the API.
    test-client:                run all tests for the client
    test-models:                run all tests for the models.
    start-api:                  launch api
    start-client:               launch client

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

build-image-client-daily:
	@docker build ./packages/client -t soker90/finper-client:daily -f ./packages/client/Dockerfile
	@docker push soker90/finper-client:daily

build-image-client-latest:
	@docker build ./packages/client -t soker90/finper-client:latest -f ./packages/client/Dockerfile
	@docker push soker90/finper-client:latest