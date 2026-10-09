using System;
using System.Collections.Generic;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using TaskTrack.API.Controllers;
using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Services;
using Xunit;

namespace TaskTrack.Tests;

public class Assignment2Tests
{
    private TaskManagementDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TaskManagementDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new TaskManagementDbContext(options);
    }

    private IConfiguration CreateConfiguration()
    {
        var inMemorySettings = new Dictionary<string, string?> {
            {"Jwt:Secret", "SuperSecretKeyForTaskTrackPrn232Assignment2_AtLeast32Chars!"},
            {"Jwt:Issuer", "TaskTrackAPI"},
            {"Jwt:Audience", "TaskTrackApp"}
        };

        return new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings!)
            .Build();
    }

    [Fact]
    public async System.Threading.Tasks.Task Register_StaffAccount_Success_HasRole0_AndHashedPassword()
    {
        var db = CreateDbContext("RegisterTestDb");
        var accountRepo = new AccountRepository(db);
        var config = CreateConfiguration();
        var accountService = new AccountService(accountRepo, config);

        var regDto = new RegisterRequestDto
        {
            FullName = "Nguyen Van A",
            Email = "staff.a@tasktrack.com",
            Password = "Password@123"
        };

        var result = await accountService.RegisterAsync(regDto);

        Assert.NotNull(result);
        Assert.Equal("staff.a@tasktrack.com", result.Email);
        Assert.Equal((short)0, result.Role); // Must be Staff

        // Verify password in DB is hashed with BCrypt, not plain text
        var accountInDb = await db.SystemAccounts.FirstAsync(a => a.Email == "staff.a@tasktrack.com");
        Assert.NotEqual("Password@123", accountInDb.PasswordHash);
        Assert.True(BCrypt.Net.BCrypt.Verify("Password@123", accountInDb.PasswordHash));
    }

    [Fact]
    public async System.Threading.Tasks.Task Register_DuplicateEmail_ThrowsInvalidOperationException_Returns409()
    {
        var db = CreateDbContext("RegisterDuplicateDb");
        var accountRepo = new AccountRepository(db);
        var config = CreateConfiguration();
        var accountService = new AccountService(accountRepo, config);
        var authController = new AuthController(accountService);

        var regDto = new RegisterRequestDto
        {
            FullName = "User 1",
            Email = "duplicate@tasktrack.com",
            Password = "Password@123"
        };

        // First registration ok
        var first = await authController.Register(regDto);
        Assert.IsType<ObjectResult>(first);
        Assert.Equal(201, (first as ObjectResult)!.StatusCode);

        // Second registration with same email returns 409 Conflict
        var second = await authController.Register(regDto);
        Assert.IsType<ConflictObjectResult>(second);
    }

    [Fact]
    public async System.Threading.Tasks.Task Login_ValidCredentials_ReturnsJwtAndRefreshToken()
    {
        var db = CreateDbContext("LoginSuccessDb");
        var accountRepo = new AccountRepository(db);
        var config = CreateConfiguration();
        var accountService = new AccountService(accountRepo, config);

        // Register user
        await accountService.RegisterAsync(new RegisterRequestDto
        {
            FullName = "Valid User",
            Email = "valid@tasktrack.com",
            Password = "Password@123"
        });

        // Login
        var loginRes = await accountService.LoginAsync(new LoginRequestDto
        {
            Email = "valid@tasktrack.com",
            Password = "Password@123"
        });

        Assert.NotNull(loginRes);
        Assert.False(string.IsNullOrWhiteSpace(loginRes.Token));
        Assert.False(string.IsNullOrWhiteSpace(loginRes.RefreshToken));
        Assert.Equal("valid@tasktrack.com", loginRes.Account.Email);
    }

    [Fact]
    public async System.Threading.Tasks.Task RefreshToken_ValidToken_ReturnsNewTokenPair()
    {
        var db = CreateDbContext("RefreshTokenDb");
        var accountRepo = new AccountRepository(db);
        var config = CreateConfiguration();
        var accountService = new AccountService(accountRepo, config);

        await accountService.RegisterAsync(new RegisterRequestDto
        {
            FullName = "Refresh User",
            Email = "refresh@tasktrack.com",
            Password = "Password@123"
        });

        var loginRes = await accountService.LoginAsync(new LoginRequestDto
        {
            Email = "refresh@tasktrack.com",
            Password = "Password@123"
        });

        Assert.NotNull(loginRes);
        var oldRefreshToken = loginRes.RefreshToken;

        // Perform refresh
        var refreshRes = await accountService.RefreshTokenAsync(oldRefreshToken);
        Assert.NotNull(refreshRes);
        Assert.False(string.IsNullOrWhiteSpace(refreshRes.Token));
        Assert.NotEqual(oldRefreshToken, refreshRes.RefreshToken); // Rotated refresh token
    }

    [Fact]
    public async System.Threading.Tasks.Task DeleteAccount_WithCreatedTasks_ThrowsInvalidOperationException()
    {
        var db = CreateDbContext("DeleteAccountGuardDb");
        var accountRepo = new AccountRepository(db);
        var config = CreateConfiguration();
        var accountService = new AccountService(accountRepo, config);

        var staff = new SystemAccount
        {
            FullName = "Staff Maker",
            Email = "maker@tasktrack.com",
            PasswordHash = "hashed",
            Role = 0,
            CreatedDate = DateTime.UtcNow
        };
        db.SystemAccounts.Add(staff);
        await db.SaveChangesAsync();

        // Linked task created by this account
        var task = new TaskTrack.Repo.Models.Task
        {
            Title = "Task by Staff",
            ProjectId = 1,
            IsActive = true,
            CreatedById = staff.AccountId
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        // Admin attempting to delete this account must fail
        await Assert.ThrowsAsync<InvalidOperationException>(() => accountService.DeleteAccountAsync(staff.AccountId));
    }

    [Fact]
    public async System.Threading.Tasks.Task AuditFields_TaskAndProjectCreation_RecordsCreatedById()
    {
        var db = CreateDbContext("AuditFieldsDb");
        var deptRepo = new DepartmentRepository(db);
        var projectRepo = new ProjectRepository(db);
        var taskRepo = new TaskRepository(db);

        var projectService = new ProjectService(projectRepo, deptRepo);
        var taskService = new TaskService(taskRepo, projectRepo);

        var dept = new Department { DepartmentName = "Dev", DepartmentDescription = "Dev", IsActive = true };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();

        int loggedInUserId = 99;

        // Create Project with audit ID
        var projDto = await projectService.CreateAsync(new CreateProjectDto
        {
            ProjectName = "Project Beta",
            DepartmentId = dept.DepartmentId,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow)
        }, loggedInUserId);

        Assert.Equal(loggedInUserId, projDto.CreatedById);
        Assert.Equal(loggedInUserId, projDto.UpdatedById);

        // Create Task with audit ID
        var taskDto = await taskService.CreateAsync(new CreateTaskDto
        {
            Title = "Task with Audit",
            ProjectId = projDto.ProjectId
        }, loggedInUserId);

        Assert.Equal(loggedInUserId, taskDto.CreatedById);
        Assert.Equal(loggedInUserId, taskDto.UpdatedById);
    }
}
