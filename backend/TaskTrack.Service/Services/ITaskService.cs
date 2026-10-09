using System.Collections.Generic;
using Task = System.Threading.Tasks.Task;
using System.Threading.Tasks;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public interface ITaskService
{
    Task<List<TaskDto>> GetAllActiveAsync();
    Task<TaskDto?> GetByIdWithTagsAsync(int id);
    Task<List<TaskDto>> GetByProjectAsync(int projectId);
    Task<TaskDto> CreateAsync(CreateTaskDto dto, int? accountId = null);
    Task<TaskDto?> UpdateAsync(int id, UpdateTaskDto dto, int? accountId = null);
    Task<bool> SoftDeleteAsync(int id);
    Task<List<TaskDto>> FilterAsync(string? title, short? status, short? priority, int? projectId, int? tagId);
}
