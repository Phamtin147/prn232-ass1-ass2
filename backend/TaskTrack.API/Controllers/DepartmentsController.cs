using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using System;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Services;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/[controller]")]
public class DepartmentsController : ControllerBase
{
    private readonly IDepartmentService _deptService;

    public DepartmentsController(IDepartmentService deptService)
    {
        _deptService = deptService;
    }

    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var departments = await _deptService.GetAllActiveAsync();
        return Ok(departments);
    }

    [HttpGet("{id:int}")]
    public async Task<IActionResult> GetById(int id)
    {
        var department = await _deptService.GetByIdWithProjectsAsync(id);
        if (department == null)
        {
            return NotFound(new { message = $"Department with ID {id} not found." });
        }
        return Ok(department);
    }

    [Authorize]
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateDepartmentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var created = await _deptService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.DepartmentId }, created);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpPut("{id:int}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateDepartmentDto dto)
    {
        if (!ModelState.IsValid)
        {
            return BadRequest(ModelState);
        }

        try
        {
            var updated = await _deptService.UpdateAsync(id, dto);
            if (updated == null)
            {
                return NotFound(new { message = $"Department with ID {id} not found." });
            }
            return Ok(updated);
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [Authorize]
    [HttpDelete("{id:int}")]
    public async Task<IActionResult> Delete(int id)
    {
        try
        {
            var success = await _deptService.DeleteAsync(id);
            if (!success)
            {
                return NotFound(new { message = $"Department with ID {id} not found." });
            }
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
        catch (Exception ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("search")]
    public async Task<IActionResult> Search([FromQuery] string? name)
    {
        var results = await _deptService.SearchByNameAsync(name ?? string.Empty);
        return Ok(results);
    }
}
