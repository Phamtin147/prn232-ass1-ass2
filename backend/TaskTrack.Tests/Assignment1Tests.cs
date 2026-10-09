using System;
using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Services;
using Xunit;

namespace TaskTrack.Tests;

public class Assignment1Tests
{
    private TaskManagementDbContext CreateDbContext(string dbName)
    {
        var options = new DbContextOptionsBuilder<TaskManagementDbContext>()
            .UseInMemoryDatabase(databaseName: dbName)
            .Options;
        return new TaskManagementDbContext(options);
    }

    [Fact]
    public async System.Threading.Tasks.Task Department_Delete_WithLinkedProjects_ThrowsInvalidOperationException()
    {
        var db = CreateDbContext("DeptDeleteFailTest");
        var deptRepo = new DepartmentRepository(db);
        var deptService = new DepartmentService(deptRepo);

        // Seed department & project
        var dept = new Department { DepartmentName = "Engineering", DepartmentDescription = "Eng Dept", IsActive = true };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();

        var project = new Project
        {
            ProjectName = "Alpha",
            DepartmentId = dept.DepartmentId,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            IsActive = true
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        // Must reject delete
        await Assert.ThrowsAsync<InvalidOperationException>(() => deptService.DeleteAsync(dept.DepartmentId));
    }

    [Fact]
    public async System.Threading.Tasks.Task Project_Delete_WithLinkedTasks_ThrowsInvalidOperationException()
    {
        var db = CreateDbContext("ProjectDeleteFailTest");
        var deptRepo = new DepartmentRepository(db);
        var projectRepo = new ProjectRepository(db);
        var projectService = new ProjectService(projectRepo, deptRepo);

        var dept = new Department { DepartmentName = "Sales", DepartmentDescription = "Sales Dept", IsActive = true };
        db.Departments.Add(dept);
        await db.SaveChangesAsync();

        var project = new Project
        {
            ProjectName = "CRM",
            DepartmentId = dept.DepartmentId,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            IsActive = true
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        var task = new TaskTrack.Repo.Models.Task
        {
            Title = "Setup CRM",
            ProjectId = project.ProjectId,
            IsActive = true
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        // Must reject delete
        await Assert.ThrowsAsync<InvalidOperationException>(() => projectService.DeleteAsync(project.ProjectId));
    }

    [Fact]
    public async System.Threading.Tasks.Task Task_Delete_PerformsSoftDelete_IsActiveBecomesFalse()
    {
        var db = CreateDbContext("TaskSoftDeleteTest");
        var taskRepo = new TaskRepository(db);
        var projectRepo = new ProjectRepository(db);
        var taskService = new TaskService(taskRepo, projectRepo);

        var project = new Project
        {
            ProjectName = "Website",
            DepartmentId = 1,
            StartDate = DateOnly.FromDateTime(DateTime.UtcNow),
            IsActive = true
        };
        db.Projects.Add(project);
        await db.SaveChangesAsync();

        var task = new TaskTrack.Repo.Models.Task
        {
            Title = "Design Mockup",
            ProjectId = project.ProjectId,
            IsActive = true,
            CreatedDate = DateTime.UtcNow
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        // Soft delete
        var success = await taskService.SoftDeleteAsync(task.TaskId);
        Assert.True(success);

        // Verify task still exists in db but IsActive is false
        var fromDb = await db.Tasks.FindAsync(task.TaskId);
        Assert.NotNull(fromDb);
        Assert.False(fromDb.IsActive);
    }

    [Fact]
    public async System.Threading.Tasks.Task Tag_Delete_UsedByTask_ThrowsInvalidOperationException()
    {
        var db = CreateDbContext("TagDeleteFailTest");
        var tagRepo = new TagRepository(db);
        var tagService = new TagService(tagRepo);

        var tag = new Tag { TagName = "Urgent", Color = "#FF0000" };
        db.Tags.Add(tag);
        await db.SaveChangesAsync();

        var task = new TaskTrack.Repo.Models.Task
        {
            Title = "Hotfix Bug",
            ProjectId = 1,
            IsActive = true,
            Tags = new List<Tag> { tag }
        };
        db.Tasks.Add(task);
        await db.SaveChangesAsync();

        // Must reject delete because tag is used by task
        await Assert.ThrowsAsync<InvalidOperationException>(() => tagService.DeleteAsync(tag.TagId));
    }
}
