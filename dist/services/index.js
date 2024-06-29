"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addService = exports.services = void 0;
exports.services = {};
/**
 * Adds a new service to the services object if it matches the interface.
 * @param name - The name of the service. This is used to index the service in the services object.
 * @param newService - The constructor function for the service.
 * @param dependencies - The dependencies for the service.
 *
 * @example
 * // Adding a TaskScheduler service
 * addService('scheduler', TaskScheduler);
 *
 * // Adding a chatService with a PrismaClient dependency
 * const prisma = new PrismaClient();
 * addService('chat', chatService, prisma);
 *
 * // Using the added services
 * services.scheduler?.addTask({ running: false, callback: () => console.log("Task executed") });
 * services.chat?.getMessages(1).then(messages => console.log(messages));
 */
function addService(name, newService, ...dependencies) {
    if (dependencies.length)
        exports.services[name] = new newService(...dependencies);
    else
        exports.services[name] = new newService();
}
exports.addService = addService;
