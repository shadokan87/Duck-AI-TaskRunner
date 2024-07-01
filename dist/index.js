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
exports.instance = void 0;
const express_1 = __importDefault(require("express"));
const dotenv_1 = __importDefault(require("dotenv"));
const env_1 = require("./env");
const services_1 = require("./services");
const minimist_1 = __importDefault(require("minimist"));
const supabase_js_1 = require("@supabase/supabase-js");
const treeService_1 = require("./services/treeService");
const bun_1 = require("bun");
const axios_1 = __importDefault(require("axios"));
const create_1 = require("./completionHandlers/create");
const update_1 = require("./completionHandlers/update");
// Load environment variables from .env file
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 3000;
const services = services_1.services;
const argv = (0, minimist_1.default)(process.argv.slice(2));
const token = argv.token;
const refresh = argv.refresh;
const supabase = (0, supabase_js_1.createClient)(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
let subscriptions = [];
exports.instance = undefined;
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
        subscriptions.forEach((subscription) => __awaiter(this, void 0, void 0, function* () {
            yield subscription.unsubscribe();
        }));
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
        exports.instance = findInstance.data[0];
        services.tree.setCwd(exports.instance.project_root);
        try {
            const tree = yield services.tree.list();
            yield supabase.from('taskRunner').update({ tree: JSON.stringify(tree) }).eq('id', exports.instance.id);
            console.log("!contents", tree);
        }
        catch (error) {
            console.error("Error listing tree contents: ", error);
        }
    }
    catch (e) {
        console.log("[Failed to connect]: ", e);
    }
    const changes = supabase
        .channel('schema-db-changes')
        .on('postgres_changes', {
        event: '*',
        schema: 'public',
    }, (payload) => __awaiter(void 0, void 0, void 0, function* () {
        switch (payload.table) {
            case 'task':
                if (payload.eventType == 'INSERT') {
                    if (payload.new.state == "AWAITING_ATTACHMENTS") {
                        console.log("[Serving task]: ", payload.new.id);
                        const attachments = yield Promise.all(payload.new.attachments.map((attachment) => __awaiter(void 0, void 0, void 0, function* () {
                            const content = yield (0, bun_1.$) `cat ${attachment.path}`;
                            console.log(`exit: ${content.exitCode}`);
                            return Object.assign(Object.assign({}, attachment), { content: content.text() });
                        })));
                        console.log(JSON.stringify(attachments));
                        yield supabase.from('task').update({ attachments: attachments }).eq('id', payload.new.id);
                        try {
                            yield axios_1.default.post("http://localhost:3000/queue", { task_id: payload.new.id, project_root: exports.instance === null || exports.instance === void 0 ? void 0 : exports.instance.project_root }, { headers: { Authorization: token } });
                        }
                        catch (e) {
                            console.error("[Failed to queue task]", e['response']['status'], e['response']['statusText']);
                        }
                    }
                }
                else if (payload.eventType == 'UPDATE') {
                    if (payload.new.state == 'COMPLETED') {
                        const completion = payload.new.completion_response;
                        completion.choices.forEach(choice => {
                            var _a;
                            (_a = choice.message.tool_calls) === null || _a === void 0 ? void 0 : _a.forEach(tool => {
                                if (tool.type == 'function') {
                                    const snippetData = JSON.parse(tool.function.arguments);
                                    switch (snippetData.actionType) {
                                        case 'create': {
                                            (0, create_1.handleCreate)(snippetData);
                                            break;
                                        }
                                        case 'update': {
                                            (0, update_1.handleUpdate)(snippetData);
                                            break;
                                        }
                                        default:
                                            { //do nothing 
                                            }
                                    }
                                }
                            });
                        });
                        console.log("!!type", typeof payload.new.completion_response);
                    }
                    console.log("!received update: ", payload);
                }
                break;
            default:
                // Ignore event
                break;
        }
    }))
        .subscribe();
    // // const taskSubscription = supabase
    // //   .channel('task')
    // //   .on('postgres_changes', { event: '*', schema: 'public', table: 'task' }, handleTaskInsert)
    // //   .subscribe();
    // subscriptions.push(taskSubscription);
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
