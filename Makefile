define help

  Usage: make <command>

  Commands:

    install:                    install all dependencies.

endef
export help

help:
	@echo "$$help"

install:
	@npm i

build-models:
	@npm --prefix packages/models/ run build

install-api:
	@npm --prefix packages/api/ i


