using System;
using System.Collections.Generic;
using System.Linq;
using Task = System.Threading.Tasks.Task;
using System.Threading.Tasks;
using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public class ProjectService : IProjectService
{
    private readonly IProjectRepository _projectRepo;
    private readonly IDepartmentRepository _deptRepo;

    public ProjectService(IProjectRepository projectRepo, IDepartmentRepository deptRepo)
    {
        _projectRepo = projectRepo;
        _deptRepo = deptRepo;
    }

    public async Task<List<ProjectDto>> GetAllActiveAsync()
    {
        var projects = await _projectRepo.GetAllActiveAsync();
        return projects.Select(MapToDto).ToList();
    }

    public async Task<ProjectDetailDto?> GetByIdWithTasksAsync(int id)
    {
        var p = await _projectRepo.GetByIdWithTasksAsync(id);
        if (p == null) return null;

        return new ProjectDetailDto
        {
            ProjectId = p.ProjectId,
            ProjectName = p.ProjectName,
            Description = p.Description,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            Status = p.Status,
            DepartmentId = p.DepartmentId,
            DepartmentName = p.Department?.DepartmentName ?? string.Empty,
            IsActive = p.IsActive,
            CreatedDate = p.CreatedDate,
            Tasks = p.Tasks.Select(t => new TaskDto
            {
                TaskId = t.TaskId,
                Title = t.Title,
                Description = t.Description,
                Status = t.Status,
                Priority = t.Priority,
                DueDate = t.DueDate,
                ProjectId = t.ProjectId,
                ProjectName = p.ProjectName,
                IsActive = t.IsActive,
                CreatedDate = t.CreatedDate,
                ModifiedDate = t.ModifiedDate,
                Tags = t.Tags.Select(tg => new TagDto
                {
                    TagId = tg.TagId,
                    TagName = tg.TagName,
                    Color = tg.Color
                }).ToList()
            }).ToList()
        };
    }

    public async Task<List<ProjectDto>> GetByDepartmentAsync(int departmentId)
    {
        var projects = await _projectRepo.GetByDepartmentAsync(departmentId);
        return projects.Select(MapToDto).ToList();
    }

    public async Task<ProjectDto> CreateAsync(CreateProjectDto dto, int? accountId = null)
    {
        var dept = await _deptRepo.GetByIdAsync(dto.DepartmentId);
        if (dept == null)
            throw new ArgumentException($"Department with ID {dto.DepartmentId} does not exist.");

        var project = new Project
        {
            ProjectName = dto.ProjectName.Trim(),
            Description = dto.Description?.Trim(),
            StartDate = dto.StartDate,
            EndDate = dto.EndDate,
            Status = dto.Status,
            DepartmentId = dto.DepartmentId,
            IsActive = dto.IsActive,
            CreatedById = accountId,
            UpdatedById = accountId
        };

        var created = await _projectRepo.CreateAsync(project);
        return MapToDto(created);
    }

    public async Task<ProjectDto?> UpdateAsync(int id, UpdateProjectDto dto, int? accountId = null)
    {
        var project = await _projectRepo.GetByIdAsync(id);
        if (project == null) return null;

        var dept = await _deptRepo.GetByIdAsync(dto.DepartmentId);
        if (dept == null)
            throw new ArgumentException($"Department with ID {dto.DepartmentId} does not exist.");

        project.ProjectName = dto.ProjectName.Trim();
        project.Description = dto.Description?.Trim();
        project.StartDate = dto.StartDate;
        project.EndDate = dto.EndDate;
        project.Status = dto.Status;
        project.DepartmentId = dto.DepartmentId;
        project.IsActive = dto.IsActive;
        if (accountId.HasValue)
        {
            project.UpdatedById = accountId;
        }

        await _projectRepo.UpdateAsync(project);
        return MapToDto(project);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var project = await _projectRepo.GetByIdAsync(id);
        if (project == null) return false;

        var hasTasks = await _projectRepo.HasTasksAsync(id);
        if (hasTasks)
        {
            throw new InvalidOperationException("Cannot delete project because it has linked tasks.");
        }

        await _projectRepo.DeleteAsync(project);
        return true;
    }

    public async Task<List<ProjectDto>> FilterAsync(string? name, short? status, int? departmentId)
    {
        var projects = await _projectRepo.FilterAsync(name, status, departmentId);
        return projects.Select(MapToDto).ToList();
    }

    private static ProjectDto MapToDto(Project p)
    {
        return new ProjectDto
        {
            ProjectId = p.ProjectId,
            ProjectName = p.ProjectName,
            Description = p.Description,
            StartDate = p.StartDate,
            EndDate = p.EndDate,
            Status = p.Status,
            DepartmentId = p.DepartmentId,
            DepartmentName = p.Department?.DepartmentName ?? string.Empty,
            IsActive = p.IsActive,
            CreatedDate = p.CreatedDate,
            CreatedById = p.CreatedById,
            UpdatedById = p.UpdatedById
        };
    }
}
