using TaskFlow.Models;

namespace TaskFlow.Services;

public interface IAuthService
{
    Task<string> RegisterAsync(User user);
    Task<string?> LoginAsync(string username, string password);
}