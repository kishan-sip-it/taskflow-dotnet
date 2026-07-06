using Microsoft.EntityFrameworkCore;
using TaskFlow.Models;

namespace TaskFlow.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options)
    {
    }

    // Ye teri Table banegi jiska naam 'Tasks' hoga
    public DbSet<TaskItem> Tasks { get; set; }
}