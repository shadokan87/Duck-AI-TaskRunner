"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.snippetSchema = void 0;
const zod_1 = __importDefault(require("zod"));
exports.snippetSchema = zod_1.default.object({
    actionDescription: zod_1.default.string().describe("concise description of what this action does example: move element X and export it"),
    actionType: zod_1.default.enum(['create', 'update']).describe("type of action: 'create' for creating new code, 'update' for modifying existing code"),
    language: zod_1.default.string().describe('the language of the source code'),
    path: zod_1.default.string().describe("the file path"),
    sourceCode: zod_1.default.string().optional().describe("the source code, to be ignored if running in DRY mode")
});
