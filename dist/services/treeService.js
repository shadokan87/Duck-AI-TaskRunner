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
exports.TreeService = void 0;
const bun_1 = require("bun");
class TreeService {
    constructor(cwd = process.env.PWD) {
        this.cwd = cwd;
    }
    setCwd(path) {
        this.cwd = path;
        return this;
    }
    list(option = {
        report: false
    }) {
        return __awaiter(this, void 0, void 0, function* () {
            // console.log("++!cwd: ", this.cwd);
            // console.log("!pwd: ", process.env.PWD);
            const report = option.report ? '' : '--noreport';
            // console.log("!cwd", this.cwd)
            const result = yield (0, bun_1.$) `tree -J \
    ${report} \
    -I node_modules
    .
    `.cwd(this.cwd).text();
            // console.log("!result", result);
            const parsed = JSON.parse(result);
            return parsed;
        });
    }
}
exports.TreeService = TreeService;
