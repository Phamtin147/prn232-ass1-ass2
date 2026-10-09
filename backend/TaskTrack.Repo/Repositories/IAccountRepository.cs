using System.Collections.Generic;
using System.Threading.Tasks;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public interface IAccountRepository
{
    Task<List<SystemAccount>> GetAllAsync();
    Task<SystemAccount?> GetByIdAsync(int id);
    Task<SystemAccount?> GetByEmailAsync(string email);
    Task<SystemAccount?> GetByRefreshTokenAsync(string refreshToken);
    Task<SystemAccount> CreateAsync(SystemAccount account);
    Task<SystemAccount> UpdateAsync(SystemAccount account);
    Task<bool> DeleteAsync(int id);
    Task<bool> HasCreatedTasksAsync(int accountId);
}
