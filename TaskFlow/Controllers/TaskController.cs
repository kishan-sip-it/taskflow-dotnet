using Microsoft.AspNetCore.Mvc;

namespace TaskFlow.Controllers;

[ApiController]
[Route("api/[controller]")]
public class TaskController : ControllerBase
{
    private static List<TaskItem> _tasks = new List<TaskItem>
    {
        new TaskItem { Id = 1, Title = "Learn .NET", Status = "In Progress" },
        new TaskItem { Id = 2, Title = "Build API",  Status = "Pending" },
        new TaskItem { Id = 3, Title = "Deploy App", Status = "Pending" }
    };

    [HttpGet]
    public IActionResult GetAll() => Ok(_tasks);

    [HttpGet("{id}")]
    public IActionResult GetById(int id)
    {
        var task = _tasks.FirstOrDefault(t => t.Id == id);
        if (task == null) return NotFound(new { message = $"Task {id} not found" });
        return Ok(task);
    }

    [HttpPost]
    public IActionResult Create([FromBody] TaskItem newTask)
    {
        newTask.Id = _tasks.Count + 1;
        newTask.Status = "Pending";
        _tasks.Add(newTask);
        return Ok(newTask);
    }

    [HttpPut("{id}")]
    public IActionResult Update(int id, [FromBody] TaskItem updated)
    {
        var task = _tasks.FirstOrDefault(t => t.Id == id);
        if (task == null) return NotFound(new { message = $"Task {id} not found" });
        task.Title = updated.Title;
        task.Status = updated.Status;
        return Ok(task);
    }

    [HttpDelete("{id}")]
    public IActionResult Delete(int id)
    {
        var task = _tasks.FirstOrDefault(t => t.Id == id);
        if (task == null) return NotFound(new { message = $"Task {id} not found" });
        _tasks.Remove(task);
        return Ok(new { message = $"Task {id} deleted" });
    }
}

public class TaskItem
{
    public int Id { get; set; }
    public string Title { get; set; }
    public string Status { get; set; }
}
