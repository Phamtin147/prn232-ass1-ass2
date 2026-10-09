using System;
using System.Collections.Generic;
using System.Linq;
using Task = System.Threading.Tasks.Task;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Models;
using TaskItem = TaskTrack.Repo.Models.Task;

namespace TaskTrack.Repo.Repositories;

public class TaskRepository : ITaskRepository
{
    private readonly TaskManagementDbContext _context;

    public TaskRepository(TaskManagementDbContext context)
    {
        _context = context;
    }

    public async Task<List<TaskItem>> GetAllActiveAsync()
    {
        return await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Tags)
            .Where(t => t.IsActive)
            .OrderBy(t => t.TaskId)
            .ToListAsync();
    }

    public async Task<TaskItem?> GetByIdWithTagsAsync(int id)
    {
        return await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.TaskId == id);
    }

    public async Task<List<TaskItem>> GetByProjectAsync(int projectId)
    {
        return await _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Tags)
            .Where(t => t.ProjectId == projectId && t.IsActive)
            .OrderBy(t => t.TaskId)
            .ToListAsync();
    }

    public async Task<TaskItem> CreateAsync(TaskItem task, IEnumerable<int>? tagIds)
    {
        task.CreatedDate = DateTime.UtcNow;
        task.IsActive = true;

        if (tagIds != null && tagIds.Any())
        {
            var tags = await _context.Tags.Where(t => tagIds.Contains(t.TagId)).ToListAsync();
            task.Tags = tags;
        }

        _context.Tasks.Add(task);
        await _context.SaveChangesAsync();
        await _context.Entry(task).Reference(t => t.Project).LoadAsync();
        return task;
    }

    public async Task UpdateAsync(TaskItem task, IEnumerable<int>? tagIds)
    {
        var existingTask = await _context.Tasks
            .Include(t => t.Tags)
            .FirstOrDefaultAsync(t => t.TaskId == task.TaskId);

        if (existingTask == null)
            throw new KeyNotFoundException($"Task with ID {task.TaskId} not found.");

        existingTask.Title = task.Title;
        existingTask.Description = task.Description;
        existingTask.Status = task.Status;
        existingTask.Priority = task.Priority;
        existingTask.DueDate = task.DueDate;
        existingTask.ProjectId = task.ProjectId;
        existingTask.ModifiedDate = DateTime.UtcNow;
        if (task.UpdatedById.HasValue)
        {
            existingTask.UpdatedById = task.UpdatedById;
        }

        if (tagIds != null)
        {
            var targetTags = await _context.Tags.Where(t => tagIds.Contains(t.TagId)).ToListAsync();
            existingTask.Tags.Clear();
            foreach (var tg in targetTags)
            {
                existingTask.Tags.Add(tg);
            }
        }

        await _context.SaveChangesAsync();
    }

    public async Task<bool> SoftDeleteAsync(int id)
    {
        var task = await _context.Tasks.FindAsync(id);
        if (task == null) return false;

        task.IsActive = false;
        task.ModifiedDate = DateTime.UtcNow;
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<List<TaskItem>> FilterAsync(string? title, short? status, short? priority, int? projectId, int? tagId)
    {
        var query = _context.Tasks
            .Include(t => t.Project)
            .Include(t => t.Tags)
            .Where(t => t.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(title))
        {
            var term = title.Trim().ToLower();
            query = query.Where(t => t.Title.ToLower().Contains(term));
        }

        if (status.HasValue)
        {
            query = query.Where(t => t.Status == status.Value);
        }

        if (priority.HasValue)
        {
            query = query.Where(t => t.Priority == priority.Value);
        }

        if (projectId.HasValue && projectId.Value > 0)
        {
            query = query.Where(t => t.ProjectId == projectId.Value);
        }

        if (tagId.HasValue && tagId.Value > 0)
        {
            query = query.Where(t => t.Tags.Any(tg => tg.TagId == tagId.Value));
        }

        return await query.OrderBy(t => t.TaskId).ToListAsync();
    }
}
