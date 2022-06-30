
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

build-models:
	@npm run build --workspace=@soker90/finper-models

start-api:
	@npm run start --workspace=@soker90/finper-api

test-api:
	@npm test --workspace=@soker90/finper-api

