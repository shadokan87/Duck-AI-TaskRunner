"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleCreate = void 0;
const bun_1 = require("bun");
const __1 = require("..");
const path_1 = require("path");
function handleCreate(snippet) {
    return __awaiter(this, void 0, void 0, function* () {
        const { sourceCode, path } = snippet;
        const joinedPath = (0, path_1.join)(__1.instance === null || __1.instance === void 0 ? void 0 : __1.instance.project_root, path);
        const folderPath = joinedPath.substring(0, joinedPath.lastIndexOf('/'));
        try {
            const folderExists = yield (0, bun_1.$) `test -d ${folderPath}`;
            if (folderExists.exitCode != 0) {
                yield (0, bun_1.$) `mkdir -p ${folderPath}`;
            }
        }
        catch (e) {
            console.error("tested folder path: ", folderPath);
        }
        yield (0, bun_1.$) `echo ${sourceCode} > ${joinedPath}`;
    });
}
exports.handleCreate = handleCreate;
