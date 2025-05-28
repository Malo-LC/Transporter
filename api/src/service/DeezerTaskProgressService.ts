import { WebSocket } from 'ws';
import { TaskProgress } from '../types/DeezerTypes';

export class DeezerTaskProgressService {
  private readonly taskProgressStore = new Map<string, TaskProgress>();

  public registerWebSocketForTask(taskId: string, ws: WebSocket): void {
    let task = this.taskProgressStore.get(taskId);

    if (!task) {
      console.warn(`[WebSocket] Task ${taskId} not found when registering client.`);

      task = {
        status: 'pending',
        percentage: 0,
        currentSong: 0,
        totalSongs: 0,
        webSocketClients: []
      };
      this.taskProgressStore.set(taskId, task);
    }
    task.webSocketClients.push(ws);

    // Send initial state immediately to new client if task already has progress
    if (task.status !== 'pending') {
      ws.send(JSON.stringify(task));
    }
  }

  public unregisterWebSocketForTask(taskId: string, ws: WebSocket): void {
    const task = this.taskProgressStore.get(taskId);

    if (task) {
      task.webSocketClients = task.webSocketClients.filter(client => client !== ws);
    }
  }

  public updateTaskProgress(
    taskId: string,
    data: Partial<Omit<TaskProgress, 'webSocketClients'>>
  ): void {
    const task = this.taskProgressStore.get(taskId);

    if (task) {
      const updatedTask = { ...task, ...data };
      this.taskProgressStore.set(taskId, updatedTask);

      // Send update to all active WebSocket clients for this task
      task.webSocketClients.forEach(client => {
        if (client.readyState === WebSocket.OPEN) { // Only send if connection is open
          try {
            client.send(JSON.stringify(updatedTask));
          } catch (sendError) {
            console.error(`[WebSocket] Error sending message to client for task ${taskId}:`, sendError);
          }
        }
      });

      // If task is completed or errors, close WebSocket connections for this task
      if (updatedTask.status === 'completed' || updatedTask.status === 'error') {
        task.webSocketClients.forEach(client => {
          if (client.readyState === WebSocket.OPEN) {
            client.close(1000, 'Task completed'); // 1000: Normal Closure
          }
        });
        task.webSocketClients = []; // Clear clients after closing
      }
    }
  }

  public getTask(taskId: string): TaskProgress | undefined {
    return this.taskProgressStore.get(taskId);
  }

  public setTask(taskId: string, task: TaskProgress): void {
    this.taskProgressStore.set(taskId, task);
  }

  public deleteTask(taskId: string): void {
    this.taskProgressStore.delete(taskId);
  }
}

const deezerTaskProgressService = new DeezerTaskProgressService();
export default deezerTaskProgressService; 