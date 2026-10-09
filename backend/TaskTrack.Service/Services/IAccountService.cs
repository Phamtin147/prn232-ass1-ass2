using System.Collections.Generic;
using System.Threading.Tasks;
using TaskTrack.Service.DTOs;

namespace TaskTrack.Service.Services;

public interface IAccountService
{
    // Auth & Profile
    Task<AccountDto> RegisterAsync(RegisterRequestDto dto);
    Task<AuthResponseDto?> LoginAsync(LoginRequestDto dto);
    Task<AuthResponseDto?> RefreshTokenAsync(string refreshToken);
    Task<AccountDto?> GetProfileAsync(int accountId);
    Task<AccountDto?> UpdateProfileAsync(int accountId, UpdateProfileDto dto);
    Task<bool> ChangePasswordAsync(int accountId, ChangePasswordDto dto);

    // Admin CRUD
    Task<List<AccountDto>> GetAllAccountsAsync();
    Task<AccountDto?> GetAccountByIdAsync(int id);
    Task<AccountDto?> UpdateAccountAsync(int id, UpdateAccountDto dto);
    Task<bool> DeleteAccountAsync(int id);
}
