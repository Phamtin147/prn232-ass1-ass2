# Build stage
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy project files for caching restore
COPY TaskTrack.sln ./
COPY TaskTrack.Repo/TaskTrack.Repo.csproj TaskTrack.Repo/
COPY TaskTrack.Service/TaskTrack.Service.csproj TaskTrack.Service/
COPY TaskTrack.API/TaskTrack.API.csproj TaskTrack.API/
COPY TaskTrack.Tests/TaskTrack.Tests.csproj TaskTrack.Tests/
RUN dotnet restore TaskTrack.sln

# Copy full source and build
COPY . .
WORKDIR /src/TaskTrack.API
RUN dotnet publish TaskTrack.API.csproj -c Release -o /app/publish

# Runtime stage
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "TaskTrack.API.dll"]
