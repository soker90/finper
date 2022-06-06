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
	@npm test --workspace=packages/models run build

start-api:
	cd packages/api && npm start

test-api:
	@npm test --workspace=packages/api

