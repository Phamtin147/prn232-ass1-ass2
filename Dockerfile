# Build stage from monorepo root
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/TaskTrack.sln ./backend/
COPY backend/TaskTrack.Repo/TaskTrack.Repo.csproj ./backend/TaskTrack.Repo/
COPY backend/TaskTrack.Service/TaskTrack.Service.csproj ./backend/TaskTrack.Service/
COPY backend/TaskTrack.API/TaskTrack.API.csproj ./backend/TaskTrack.API/
COPY backend/TaskTrack.Tests/TaskTrack.Tests.csproj ./backend/TaskTrack.Tests/
RUN dotnet restore backend/TaskTrack.sln

COPY backend/ ./backend/
WORKDIR /src/backend/TaskTrack.API
RUN dotnet publish TaskTrack.API.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "TaskTrack.API.dll"]
