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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const env_1 = require("./env");
const services_1 = require("./services");
const minimist_1 = __importDefault(require("minimist"));
const supabase_js_1 = require("@supabase/supabase-js");
const treeService_1 = require("./services/treeService");
// Load environment variables from .env file
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const services = services_1.services;
const argv = (0, minimist_1.default)(process.argv.slice(2));
const token = argv.token;
const refresh = argv.refresh;
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
let instance = undefined;
let user = undefined;
function connectTaskRunner() {
    return __awaiter(this, void 0, void 0, function* () {
        yield supabase.from("taskRunner").delete().neq("id", -1);
        const insert = yield supabase.from("taskRunner").insert([{ connected: true, project_root: "/Users/shadokan87/duc-Kopilot/mocks/helloWorld" }]);
        return insert;
    });
}
function onServerStop() {
    return __awaiter(this, void 0, void 0, function* () {
        if (!user)
            return;
        yield supabase.from('taskRunner').delete().neq('id', -1);
    });
}
function login() {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield supabase.auth.setSession({ access_token: token, refresh_token: refresh });
        return response;
    });
}
app.get("/", (req, res) => {
    res.send("Express + TypeScript Server");
});
app.listen(port, () => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const init = yield (0, env_1.bootStrap)();
    if (init)
        process.exit(init);
    (0, services_1.addService)('tree', treeService_1.TreeService);
    // Connection
    try {
        const loginResponse = yield login();
        if (loginResponse.error)
            throw new Error("Login error");
        user = yield supabase.auth.getUser();
        console.log(`[Login success as]: ${(_a = user.data.user) === null || _a === void 0 ? void 0 : _a.email}`);
    }
    catch (e) {
        console.error("[Login failed]: ", e);
        process.exit(1);
    }
    try {
        const connectionResponse = yield connectTaskRunner();
        const findInstance = yield supabase.from('taskRunner').select('*');
        if (findInstance.error) {
            //TODO: handle error
            console.error(findInstance.error);
            return;
        }
        instance = findInstance.data[0];
        // services.tree.setCwd(instance.)
    }
    catch (e) {
        console.log("[Failed to connect]: ", e);
    }
    console.log(`⚡️[server]: TaskRunner Server is running at https://localhost:${port}`);
}));
process.on('SIGINT', () => __awaiter(void 0, void 0, void 0, function* () {
    yield onServerStop();
    process.exit(0);
}));
process.on('SIGTERM', () => __awaiter(void 0, void 0, void 0, function* () {
    yield onServerStop();
    process.exit(0);
}));
