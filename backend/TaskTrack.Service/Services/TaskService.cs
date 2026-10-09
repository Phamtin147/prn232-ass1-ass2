using System;
using System.Collections.Generic;
using System.Linq;
using Task = System.Threading.Tasks.Task;
using System.Threading.Tasks;
using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;
using TaskItem = TaskTrack.Repo.Models.Task;

namespace TaskTrack.Service.Services;

public class TaskService : ITaskService
{
    private readonly ITaskRepository _taskRepo;
    private readonly IProjectRepository _projectRepo;

    public TaskService(ITaskRepository taskRepo, IProjectRepository projectRepo)
    {
        _taskRepo = taskRepo;
        _projectRepo = projectRepo;
    }

    public async Task<List<TaskDto>> GetAllActiveAsync()
    {
        var tasks = await _taskRepo.GetAllActiveAsync();
        return tasks.Select(MapToDto).ToList();
    }

    public async Task<TaskDto?> GetByIdWithTagsAsync(int id)
    {
        var task = await _taskRepo.GetByIdWithTagsAsync(id);
        if (task == null) return null;
        return MapToDto(task);
    }

    public async Task<List<TaskDto>> GetByProjectAsync(int projectId)
    {
        var tasks = await _taskRepo.GetByProjectAsync(projectId);
        return tasks.Select(MapToDto).ToList();
    }

    public async Task<TaskDto> CreateAsync(CreateTaskDto dto, int? accountId = null)
    {
        var project = await _projectRepo.GetByIdAsync(dto.ProjectId);
        if (project == null)
            throw new ArgumentException($"Project with ID {dto.ProjectId} does not exist.");

        var task = new TaskItem
        {
            Title = dto.Title.Trim(),
            Description = dto.Description?.Trim(),
            Status = dto.Status,
            Priority = dto.Priority,
            DueDate = dto.DueDate,
            ProjectId = dto.ProjectId,
            IsActive = true,
            CreatedById = accountId,
            UpdatedById = accountId
        };

        var created = await _taskRepo.CreateAsync(task, dto.TagIds);
        return MapToDto(created);
    }

    public async Task<TaskDto?> UpdateAsync(int id, UpdateTaskDto dto, int? accountId = null)
    {
        var task = await _taskRepo.GetByIdWithTagsAsync(id);
        if (task == null) return null;

        var project = await _projectRepo.GetByIdAsync(dto.ProjectId);
        if (project == null)
            throw new ArgumentException($"Project with ID {dto.ProjectId} does not exist.");

        task.Title = dto.Title.Trim();
        task.Description = dto.Description?.Trim();
        task.Status = dto.Status;
        task.Priority = dto.Priority;
        task.DueDate = dto.DueDate;
        task.ProjectId = dto.ProjectId;
        if (accountId.HasValue)
        {
            task.UpdatedById = accountId;
        }

        await _taskRepo.UpdateAsync(task, dto.TagIds);

        var updated = await _taskRepo.GetByIdWithTagsAsync(id);
        return updated != null ? MapToDto(updated) : null;
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        return await _taskRepo.SoftDeleteAsync(id);
    }

    public async Task<List<TaskDto>> FilterAsync(string? title, short? status, short? priority, int? projectId, int? tagId)
    {
        var tasks = await _taskRepo.FilterAsync(title, status, priority, projectId, tagId);
        return tasks.Select(MapToDto).ToList();
    }

    private static TaskDto MapToDto(TaskItem t)
    {
        return new TaskDto
        {
            TaskId = t.TaskId,
            Title = t.Title,
            Description = t.Description,
            Status = t.Status,
            Priority = t.Priority,
            DueDate = t.DueDate,
            ProjectId = t.ProjectId,
            ProjectName = t.Project?.ProjectName ?? string.Empty,
            IsActive = t.IsActive,
            CreatedDate = t.CreatedDate,
            ModifiedDate = t.ModifiedDate,
            CreatedById = t.CreatedById,
            UpdatedById = t.UpdatedById,
            Tags = t.Tags?.Select(tg => new TagDto
            {
                TagId = tg.TagId,
                TagName = tg.TagName,
                Color = tg.Color
            }).ToList() ?? new List<TagDto>()
        };
    }
}
