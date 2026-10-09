using System.Collections.Generic;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using TaskTrack.Repo.Models;

namespace TaskTrack.Repo.Repositories;

public class AccountRepository : IAccountRepository
{
    private readonly TaskManagementDbContext _context;

    public AccountRepository(TaskManagementDbContext context)
    {
        _context = context;
    }

    public async Task<List<SystemAccount>> GetAllAsync()
    {
        return await _context.SystemAccounts
            .OrderBy(a => a.AccountId)
            .ToListAsync();
    }

    public async Task<SystemAccount?> GetByIdAsync(int id)
    {
        return await _context.SystemAccounts.FirstOrDefaultAsync(a => a.AccountId == id);
    }

    public async Task<SystemAccount?> GetByEmailAsync(string email)
    {
        return await _context.SystemAccounts
            .FirstOrDefaultAsync(a => a.Email.ToLower() == email.Trim().ToLower());
    }

    public async Task<SystemAccount?> GetByRefreshTokenAsync(string refreshToken)
    {
        return await _context.SystemAccounts
            .FirstOrDefaultAsync(a => a.RefreshToken == refreshToken);
    }

    public async Task<SystemAccount> CreateAsync(SystemAccount account)
    {
        _context.SystemAccounts.Add(account);
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task<SystemAccount> UpdateAsync(SystemAccount account)
    {
        _context.Entry(account).State = EntityState.Modified;
        await _context.SaveChangesAsync();
        return account;
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var account = await _context.SystemAccounts.FindAsync(id);
        if (account == null) return false;

        _context.SystemAccounts.Remove(account);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<bool> HasCreatedTasksAsync(int accountId)
    {
        return await _context.Tasks.AnyAsync(t => t.CreatedById == accountId);
    }
}
