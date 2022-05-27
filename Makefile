define help

  Usage: make <command>

  Commands:

    install:                    install all dependencies.

endef
export help

help:
	@echo "$$help"

install: install-models install-api

install-models:
	@npm --prefix packages/models/ i

install-api:
	@npm --prefix packages/api/ i
