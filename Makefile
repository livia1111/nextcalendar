.PHONY: help run backend-run backend-test backend-build backend-clean

HELP_PREFIX := \033[36m
HELP_SUFFIX := \033[0m

help:
	@echo "$(HELP_PREFIX)Comandos disponíveis:$(HELP_SUFFIX)"
	@echo "  make help             Exibe esta ajuda"
	@echo "  make run              Inicia o backend (alias para backend-run)"
	@echo "  make backend-run      Roda a aplicação Spring Boot"
	@echo "  make backend-test     Executa os testes do backend"
	@echo "  make backend-build    Compila e empacota o backend"
	@echo "  make backend-clean    Remove os artefatos de build"

run: backend-run

backend-run:
	@cd backend && ./mvnw spring-boot:run

backend-test:
	@cd backend && ./mvnw test

backend-build:
	@cd backend && ./mvnw package -DskipTests

backend-clean:
	@cd backend && ./mvnw clean
