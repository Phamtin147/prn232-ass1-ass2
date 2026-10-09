using System;
using System.ComponentModel.DataAnnotations;

namespace TaskTrack.Service.DTOs;

public class AccountDto
{
    public int AccountId { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public short Role { get; set; } // 0 = Staff, 1 = Admin
    public DateTime CreatedDate { get; set; }
}

public class RegisterRequestDto
{
    [Required(ErrorMessage = "Full Name is required")]
    [StringLength(100, ErrorMessage = "Full Name cannot exceed 100 characters")]
    public string FullName { get; set; } = string.Empty;

    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    [StringLength(150, ErrorMessage = "Email cannot exceed 150 characters")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    [MinLength(6, ErrorMessage = "Password must be at least 6 characters")]
    public string Password { get; set; } = string.Empty;
}

public class LoginRequestDto
{
    [Required(ErrorMessage = "Email is required")]
    [EmailAddress(ErrorMessage = "Invalid email format")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Password is required")]
    public string Password { get; set; } = string.Empty;
}

public class AuthResponseDto
{
    public string Token { get; set; } = string.Empty;
    public string RefreshToken { get; set; } = string.Empty;
    public AccountDto Account { get; set; } = null!;
}

public class RefreshTokenRequestDto
{
    [Required(ErrorMessage = "RefreshToken is required")]
    public string RefreshToken { get; set; } = string.Empty;
}

public class UpdateAccountDto
{
    [StringLength(100, ErrorMessage = "Full Name cannot exceed 100 characters")]
    public string? FullName { get; set; }

    [Range(0, 1, ErrorMessage = "Role must be 0 (Staff) or 1 (Admin)")]
    public short? Role { get; set; }
}

public class UpdateProfileDto
{
    [Required(ErrorMessage = "Full Name is required")]
    [StringLength(100, ErrorMessage = "Full Name cannot exceed 100 characters")]
    public string FullName { get; set; } = string.Empty;
}

public class ChangePasswordDto
{
    [Required(ErrorMessage = "Current password is required")]
    public string CurrentPassword { get; set; } = string.Empty;

    [Required(ErrorMessage = "New password is required")]
    [MinLength(6, ErrorMessage = "New password must be at least 6 characters")]
    public string NewPassword { get; set; } = string.Empty;
}
