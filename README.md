# NextCalendar

Um projeto de calendário moderno desenvolvido com arquitetura de monorepo, separando frontend e backend para melhor manutenção e escalabilidade.

## 📋 Requisitos

### Geral
- Git
- Make (opcional, mas recomendado)

### Backend
- Java 11 ou superior
- Maven 3.6.0 ou superior (ou use o Maven Wrapper incluído)

### Frontend
- Node.js 14.0.0 ou superior
- npm ou yarn

## 🚀 Como Executar

### Executando o Backend

#### Usando Make (Recomendado)
```bash
# Exibir todos os comandos disponíveis
make help

# Executar a aplicação Spring Boot
make run

# Ou especificamente
make backend-run
```

#### Sem Make
```bash
cd backend

# Em Linux/Mac
./mvnw spring-boot:run

# Em Windows
mvnw.cmd spring-boot:run
```

### Executando Testes do Backend

#### Usando Make
```bash
make backend-test
```

#### Sem Make
```bash
cd backend
./mvnw test
```

### Build do Backend

#### Usando Make
```bash
make backend-build
```

#### Sem Make
```bash
cd backend
./mvnw package -DskipTests
```

### Limpando Build Artifacts

#### Usando Make
```bash
make backend-clean
```

#### Sem Make
```bash
cd backend
./mvnw clean
```

### Executando o Frontend

```bash
cd frontend

# Instalar dependências
npm install
# ou
yarn install

# Executar em desenvolvimento
npm start
# ou
yarn start

# Build para produção
npm run build
# ou
yarn build
```

## 📁 Estrutura do Projeto

```
nextcalendarv1/
├── Makefile              # Comandos de build e execução
├── README.md            # Este arquivo
├── backend/             # API Spring Boot
│   ├── src/
│   ├── pom.xml
│   ├── mvnw
│   └── mvnw.cmd
└── frontend/            # Aplicação Frontend (React/Vue/Angular)
    └── (será inicializado)
```

## 🛠️ Principais Comandos

| Comando | Descrição |
|---------|-----------|
| `make help` | Exibe todos os comandos disponíveis |
| `make run` | Inicia o backend |
| `make backend-test` | Executa testes do backend |
| `make backend-build` | Compila o backend |
| `make backend-clean` | Remove artefatos de build |

## 📝 Notas

- A aplicação backend roda por padrão em `http://localhost:8080`
- Para alterar a porta, configure em `backend/src/main/resources/application.properties`
- O projeto está estruturado como monorepo para facilitar desenvolvimento paralelo de frontend e backend

## 🤝 Contribuindo

Ao fazer alterações, utilize commits semânticos seguindo a convenção Conventional Commits:
- `feat:` para novas features
- `fix:` para correções de bugs
- `refactor:` para refatoração de código
- `docs:` para alterações em documentação
- `test:` para testes
- `chore:` para outras tarefas

## 📧 Suporte

Para dúvidas ou problemas, verifique o README específico de cada diretório:
- [Backend README](./backend/README.md)
