# TaskFlow

A full-stack task management application built with ASP.NET Core, C#, Entity Framework Core, SQLite, JWT authentication, Swagger/OpenAPI, and a React-based frontend.

## Highlights

- ASP.NET Core REST API with Controllers / Services / Data / Models structure
- User registration and JWT-based login
- BCrypt password hashing
- Protected task CRUD endpoints
- Entity Framework Core with SQLite persistence
- Swagger/OpenAPI for API exploration and testing
- Configurable CORS for frontend integration
- React frontend in `frontend/`

## Architecture

```text
Browser / React frontend
        |
        | HTTP / JSON
        v
ASP.NET Core Web API
        |
        +-- Controllers
        +-- Services
        +-- JWT Authentication
        +-- Entity Framework Core
        |
        v
     SQLite DB
```

## Project Structure

```text
taskflow-dotnet/
├── TaskFlow/
│   ├── Controllers/
│   ├── Data/
│   ├── Models/
│   ├── Services/
│   ├── Program.cs
│   ├── TaskFlow.csproj
│   ├── appsettings.json
│   └── taskmaster.db (created locally; ignored by Git)
├── frontend/
└── .gitignore
```

## Requirements

- .NET SDK 10+
- Node.js 20+ for the frontend
- Git

## Configuration

Do not commit real secrets. `appsettings.json` contains only a placeholder JWT key.

For local development, set a real JWT key with .NET user secrets:

```bash
dotnet user-secrets init --project TaskFlow/TaskFlow.csproj
dotnet user-secrets set "Jwt:Key" "replace-with-a-random-secret-at-least-32-characters" --project TaskFlow/TaskFlow.csproj
dotnet user-secrets set "Jwt:Issuer" "TaskFlow" --project TaskFlow/TaskFlow.csproj
dotnet user-secrets set "Jwt:Audience" "TaskFlowUsers" --project TaskFlow/TaskFlow.csproj
```

Configure frontend origins with `Cors:AllowedOrigins` for production.

## Run the API

```bash
dotnet restore TaskFlow/TaskFlow.csproj
dotnet build TaskFlow/TaskFlow.csproj
dotnet run --project TaskFlow/TaskFlow.csproj
```

In Development, Swagger is available at the `/swagger` route shown in the console output.

The SQLite database is created automatically as `TaskFlow/taskmaster.db` on first run.

## Authentication API

### Register

```http
POST /api/Auth/register
Content-Type: application/json
```

```json
{
  "username": "kishan",
  "passwordHash": "change-this-password"
}
```

The current API keeps the `passwordHash` field for compatibility; the server BCrypt-hashes the supplied value before storage.

### Login

```http
POST /api/Auth/login
Content-Type: application/json
```

```json
{
  "username": "kishan",
  "password": "change-this-password"
}
```

The response contains a JWT token.

## Task API

All task endpoints require:

```http
Authorization: Bearer <jwt>
```

```text
GET    /api/Task
GET    /api/Task/{id}
POST   /api/Task
PUT    /api/Task/{id}
DELETE /api/Task/{id}
```

Create example:

```json
{
  "title": "Finish API documentation",
  "status": "Pending"
}
```

## Security Notes

- Passwords are hashed with BCrypt instead of a fast unsalted SHA-256 digest.
- Task endpoints require JWT authorization.
- JWT configuration is validated at startup.
- The old hardcoded development admin account was removed.
- Local SQLite databases and environment files are excluded from Git.
- Configure allowed frontend origins for production deployments.

## Next Extensions

Good next steps include per-user task ownership, pagination/filtering, request DTOs, automated integration tests, refresh tokens, and a production database such as PostgreSQL or SQL Server.

## Author

**Kishan Marwadi**

GitHub: https://github.com/kishan-sip-it
LinkedIn: https://www.linkedin.com/in/kishan-m1211/
