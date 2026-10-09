using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskTrack.Service.DTOs;
using TaskTrack.Service.Services;

namespace TaskTrack.API.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly IAccountService _accountService;

    public AuthController(IAccountService accountService)
    {
        _accountService = accountService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var created = await _accountService.RegisterAsync(dto);
            return StatusCode(201, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { message = ex.Message });
        }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _accountService.LoginAsync(dto);
        if (result == null)
        {
            return Unauthorized(new { message = "Invalid email or password." });
        }

        return Ok(result);
    }

    [HttpPost("refresh-token")]
    public async Task<IActionResult> RefreshToken([FromBody] RefreshTokenRequestDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var result = await _accountService.RefreshTokenAsync(dto.RefreshToken);
        if (result == null)
        {
            return Unauthorized(new { message = "Invalid or expired refresh token." });
        }

        return Ok(result);
    }

    [Authorize]
    [HttpGet("profile")]
    public async Task<IActionResult> GetProfile()
    {
        var accountIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("AccountID");
        if (string.IsNullOrEmpty(accountIdStr) || !int.TryParse(accountIdStr, out int accountId))
        {
            return Unauthorized();
        }

        var profile = await _accountService.GetProfileAsync(accountId);
        if (profile == null)
            return NotFound(new { message = "User not found." });

        return Ok(profile);
    }

    [Authorize]
    [HttpPut("profile")]
    public async Task<IActionResult> UpdateProfile([FromBody] UpdateProfileDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var accountIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("AccountID");
        if (string.IsNullOrEmpty(accountIdStr) || !int.TryParse(accountIdStr, out int accountId))
        {
            return Unauthorized();
        }

        var updated = await _accountService.UpdateProfileAsync(accountId, dto);
        if (updated == null)
            return NotFound(new { message = "User not found." });

        return Ok(updated);
    }

    [Authorize]
    [HttpPost("change-password")]
    public async Task<IActionResult> ChangePassword([FromBody] ChangePasswordDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        var accountIdStr = User.FindFirstValue(ClaimTypes.NameIdentifier) ?? User.FindFirstValue("AccountID");
        if (string.IsNullOrEmpty(accountIdStr) || !int.TryParse(accountIdStr, out int accountId))
        {
            return Unauthorized();
        }

        var success = await _accountService.ChangePasswordAsync(accountId, dto);
        if (!success)
        {
            return BadRequest(new { message = "Incorrect current password." });
        }

        return Ok(new { message = "Password updated successfully." });
    }
}
