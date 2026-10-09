using System.Collections.Generic;
using Task = System.Threading.Tasks.Task;
using System.Threading.Tasks;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public interface IProjectService
{
    Task<List<ProjectDto>> GetAllActiveAsync();
    Task<ProjectDetailDto?> GetByIdWithTasksAsync(int id);
    Task<List<ProjectDto>> GetByDepartmentAsync(int departmentId);
    Task<ProjectDto> CreateAsync(CreateProjectDto dto, int? accountId = null);
    Task<ProjectDto?> UpdateAsync(int id, UpdateProjectDto dto, int? accountId = null);
    Task<bool> DeleteAsync(int id);
    Task<List<ProjectDto>> FilterAsync(string? name, short? status, int? departmentId);
}
