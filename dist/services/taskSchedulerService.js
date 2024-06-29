"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.TaskScheduler = void 0;
class TaskScheduler {
    constructor() {
        this.queue = [];
        this.active = false;
        this.startBackgroundTask();
    }
    addTask(task) {
        this.queue.push(task);
    }
    processQueue() {
        if (this.active || this.queue.length === 0) {
            return false; // Indicate that no task was processed
        }
        this.active = true;
        const task = this.queue.shift();
        if (task) {
            task.running = true;
            task.callback();
            task.running = false;
            this.active = false;
        }
        return true; // Indicate that a task was processed
    }
    startBackgroundTask() {
        const backgroundTask = () => {
            const didWork = this.processQueue();
            if (didWork) {
                // If a task was processed, check again immediately
                setImmediate(backgroundTask);
            }
            else {
                // If no task was processed, wait a bit before checking again to avoid tight looping
                setTimeout(backgroundTask, 100); // Check every 100ms
            }
        };
        backgroundTask(); // Start the background task
    }
}
exports.TaskScheduler = TaskScheduler;
