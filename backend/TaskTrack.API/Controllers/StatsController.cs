using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.Services;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class StatsController : ControllerBase
{
    private readonly IDepartmentService _deptService;
    private readonly IProjectService _projectService;
    private readonly ITaskService _taskService;
    private readonly ITagService _tagService;

    public StatsController(
        IDepartmentService deptService,
        IProjectService projectService,
        ITaskService taskService,
        ITagService tagService)
    {
        _deptService = deptService;
        _projectService = projectService;
        _taskService = taskService;
        _tagService = tagService;
    }

    [HttpGet]
    public async Task<IActionResult> GetStats()
    {
        var departments = await _deptService.GetAllActiveAsync();
        var projects = await _projectService.GetAllActiveAsync();
        var tasks = await _taskService.GetAllActiveAsync();
        var tags = await _tagService.GetAllAsync();

        return Ok(new
        {
            departmentsCount = departments.Count,
            projectsCount = projects.Count,
            tasksCount = tasks.Count,
            tagsCount = tags.Count
        });
    }
}
