using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using TaskFlow.Services;
using TaskFlow.Models;

namespace TaskFlow.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class TaskController : ControllerBase
{
    private readonly ITaskService _taskService;

    public TaskController(ITaskService taskService)
    {
        _taskService = taskService;
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<TaskItem>>> GetTasks()
    {
        return Ok(await _taskService.GetAllTasksAsync());
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<TaskItem>> GetTask(int id)
    {
        var task = await _taskService.GetTaskByIdAsync(id);
        return task == null ? NotFound() : Ok(task);
    }

    [HttpPost]
    public async Task<ActionResult<TaskItem>> CreateTask([FromBody] TaskItem task)
    {
        if (string.IsNullOrWhiteSpace(task.Title))
            return BadRequest("Task title is required.");

        var createdTask = await _taskService.CreateTaskAsync(task);
        return CreatedAtAction(nameof(GetTask), new { id = createdTask.Id }, createdTask);
    }

    [HttpPut("{id:int}")]
    public async Task<IActionResult> UpdateTask(int id, [FromBody] TaskItem task)
    {
        if (string.IsNullOrWhiteSpace(task.Title))
            return BadRequest("Task title is required.");

        var updatedTask = await _taskService.UpdateTaskAsync(id, task);
        return updatedTask == null ? NotFound() : NoContent();
    }

    [HttpDelete("{id:int}")]
    public async Task<IActionResult> DeleteTask(int id)
    {
        var deleted = await _taskService.DeleteTaskAsync(id);
        return deleted ? NoContent() : NotFound();
    }
}
