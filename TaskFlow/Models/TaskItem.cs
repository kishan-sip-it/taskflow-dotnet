namespace TaskFlow.Models;

public class TaskItem
{
    public int Id { get; set; } // Primary Key (Auto-increment)
    public string Title { get; set; } = string.Empty;
    public string Status { get; set; } = "Pending"; // Pending, In Progress, Completed
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}