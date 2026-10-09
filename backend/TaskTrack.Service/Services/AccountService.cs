using System;
using System.Collections.Generic;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;
using System.Threading.Tasks;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using TaskTrack.Repo.Models;
using TaskTrack.Repo.Repositories;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public class AccountService : IAccountService
{
    private readonly IAccountRepository _accountRepo;
    private readonly IConfiguration _config;

    public AccountService(IAccountRepository accountRepo, IConfiguration config)
    {
        _accountRepo = accountRepo;
        _config = config;
    }

    public async Task<AccountDto> RegisterAsync(RegisterRequestDto dto)
    {
        var existing = await _accountRepo.GetByEmailAsync(dto.Email);
        if (existing != null)
        {
            throw new InvalidOperationException("Email is already registered.");
        }

        var account = new SystemAccount
        {
            FullName = dto.FullName.Trim(),
            Email = dto.Email.Trim().ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = 0, // Staff only for register API
            CreatedDate = DateTime.UtcNow
        };

        var created = await _accountRepo.CreateAsync(account);
        return MapToDto(created);
    }

    public async Task<AuthResponseDto?> LoginAsync(LoginRequestDto dto)
    {
        var account = await _accountRepo.GetByEmailAsync(dto.Email);
        if (account == null) return null;

        bool verified = false;
        try
        {
            verified = BCrypt.Net.BCrypt.Verify(dto.Password, account.PasswordHash);
        }
        catch
        {
            verified = false;
        }

        if (!verified) return null;

        var token = GenerateJwtToken(account);
        var refreshToken = GenerateRefreshToken();
        
        account.RefreshToken = refreshToken;
        account.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _accountRepo.UpdateAsync(account);

        return new AuthResponseDto
        {
            Token = token,
            RefreshToken = refreshToken,
            Account = MapToDto(account)
        };
    }

    public async Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken)
    {
        if (string.IsNullOrWhiteSpace(refreshToken)) return null;

        var account = await _accountRepo.GetByRefreshTokenAsync(refreshToken);
        if (account == null || account.RefreshTokenExpiry == null || account.RefreshTokenExpiry <= DateTime.UtcNow)
        {
            return null;
        }

        var newToken = GenerateJwtToken(account);
        var newRefreshToken = GenerateRefreshToken();

        account.RefreshToken = newRefreshToken;
        account.RefreshTokenExpiry = DateTime.UtcNow.AddDays(7);
        await _accountRepo.UpdateAsync(account);

        return new AuthResponseDto
        {
            Token = newToken,
            RefreshToken = newRefreshToken,
            Account = MapToDto(account)
        };
    }

    public async Task<AccountDto?> GetProfileAsync(int accountId)
    {
        var account = await _accountRepo.GetByIdAsync(accountId);
        return account != null ? MapToDto(account) : null;
    }

    public async Task<AccountDto?> UpdateProfileAsync(int accountId, UpdateProfileDto dto)
    {
        var account = await _accountRepo.GetByIdAsync(accountId);
        if (account == null) return null;

        account.FullName = dto.FullName.Trim();
        await _accountRepo.UpdateAsync(account);
        return MapToDto(account);
    }

    public async Task<bool> ChangePasswordAsync(int accountId, ChangePasswordDto dto)
    {
        var account = await _accountRepo.GetByIdAsync(accountId);
        if (account == null) return false;

        if (!BCrypt.Net.BCrypt.Verify(dto.CurrentPassword, account.PasswordHash))
        {
            return false;
        }

        account.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.NewPassword);
        await _accountRepo.UpdateAsync(account);
        return true;
    }

    public async Task<List<AccountDto>> GetAllAccountsAsync()
    {
        var accounts = await _accountRepo.GetAllAsync();
        return accounts.Select(MapToDto).ToList();
    }

    public async Task<AccountDto?> GetAccountByIdAsync(int id)
    {
        var account = await _accountRepo.GetByIdAsync(id);
        return account != null ? MapToDto(account) : null;
    }

    public async Task<AccountDto?> UpdateAccountAsync(int id, UpdateAccountDto dto)
    {
        var account = await _accountRepo.GetByIdAsync(id);
        if (account == null) return null;

        if (!string.IsNullOrWhiteSpace(dto.FullName))
        {
            account.FullName = dto.FullName.Trim();
        }

        if (dto.Role.HasValue)
        {
            account.Role = dto.Role.Value;
        }

        await _accountRepo.UpdateAsync(account);
        return MapToDto(account);
    }

    public async Task<bool> DeleteAccountAsync(int id)
    {
        var account = await _accountRepo.GetByIdAsync(id);
        if (account == null) return false;

        var hasCreatedTasks = await _accountRepo.HasCreatedTasksAsync(id);
        if (hasCreatedTasks)
        {
            throw new InvalidOperationException("Cannot delete account because it has created tasks.");
        }

        return await _accountRepo.DeleteAsync(id);
    }

    private string GenerateJwtToken(SystemAccount account)
    {
        var secret = Environment.GetEnvironmentVariable("JWT_SECRET") 
                     ?? _config["Jwt:Secret"] 
                     ?? "SuperSecretKeyForTaskTrackPrn232Assignment2_AtLeast32Chars!";
        
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var roleName = account.Role == 1 ? "Admin" : "Staff";
        var claims = new[]
        {
            new Claim(ClaimTypes.NameIdentifier, account.AccountId.ToString()),
            new Claim("AccountID", account.AccountId.ToString()),
            new Claim(ClaimTypes.Email, account.Email),
            new Claim(ClaimTypes.Name, account.FullName),
            new Claim(ClaimTypes.Role, roleName),
            new Claim("Role", account.Role.ToString())
        };

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"] ?? "TaskTrackAPI",
            audience: _config["Jwt:Audience"] ?? "TaskTrackApp",
            claims: claims,
            expires: DateTime.UtcNow.AddHours(24),
            signingCredentials: creds
        );

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private static string GenerateRefreshToken()
    {
        var randomNumber = new byte[32];
        using var rng = RandomNumberGenerator.Create();
        rng.GetBytes(randomNumber);
        return Convert.ToBase64String(randomNumber);
    }

    private static AccountDto MapToDto(SystemAccount a)
    {
        return new AccountDto
        {
            AccountId = a.AccountId,
            FullName = a.FullName,
            Email = a.Email,
            Role = a.Role,
            CreatedDate = a.CreatedDate
        };
    }
}
