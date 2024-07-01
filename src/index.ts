import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { bootStrap } from "./env";
import { Iservices, addService, services as servicesNonStatic } from "./services";
import z from "zod";
import minimist from "minimist";
import { RealtimeChannel, RealtimePostgresChangesPayload, RealtimePostgresInsertPayload, Subscription, UserResponse, createClient } from '@supabase/supabase-js';
import { Database } from "./types/supabase";
import { TreeService } from "./services/treeService";
import { $ } from "bun";
import axios from "axios";
import OpenAI from "openai";
import { handleCreate } from "./completionHandlers/create";
import { snippetSchema } from "./types/codeSnippet";
import { handleUpdate } from "./completionHandlers/update";

// Load environment variables from .env file
dotenv.config();
type taskRunenrType = Database['public']['Tables']['taskRunner']['Row'];
const app: Express = express();
const port = process.env.PORT || 3000;
const services = servicesNonStatic as Iservices;

const argv = minimist(process.argv.slice(2));
const token = argv.token;
const refresh = argv.refresh;
const supabase = createClient<Database>(process.env.SUPABASE_URL, process.env.SUPABASE_API_KEY);
let subscriptions: RealtimeChannel[] = [];

export let instance: taskRunenrType | undefined = undefined;
let user: UserResponse | undefined = undefined;
async function connectTaskRunner() {
  await supabase.from("taskRunner").delete().neq("id", -1);
  const insert = await supabase.from("taskRunner").insert([{ connected: true, project_root: "/Users/shadokan87/duc-Kopilot/mocks/helloWorld" }]);
  return insert;
}

async function onServerStop() {
  subscriptions.forEach(async (subscription) => {
    await subscription.unsubscribe();
  });

  if (!user)
    return;
  await supabase.from('taskRunner').delete().neq('id', -1);
}

async function login() {
  const response = await supabase.auth.setSession({ access_token: token, refresh_token: refresh });
  return response;
}

app.get("/", (req: Request, res: Response) => {
  res.send("Express + TypeScript Server");
});

app.listen(port, async () => {
  const init = await bootStrap();
  if (init)
    process.exit(init);
  addService('tree', TreeService);
  // Connection
  try {
    const loginResponse = await login();
    if (loginResponse.error)
      throw new Error("Login error");
    user = await supabase.auth.getUser();
    console.log(`[Login success as]: ${user.data.user?.email}`)
  } catch (e) {
    console.error("[Login failed]: ", e);
    process.exit(1);
  }
  try {
    const connectionResponse = await connectTaskRunner();
    const findInstance = await supabase.from('taskRunner').select('*');
    if (findInstance.error) {
      //TODO: handle error
      console.error(findInstance.error);
      return;
    }
    instance = findInstance.data[0];
    services.tree.setCwd(instance.project_root!);
    try {
      const tree = await services.tree.list();
      await supabase.from('taskRunner').update({ tree: JSON.stringify(tree) }).eq('id', instance.id);
      console.log("!contents", tree);
    } catch (error) {
      console.error("Error listing tree contents: ", error);
    }
  } catch (e) {
    console.log("[Failed to connect]: ", e);
  }

  // Realtime
  // const handleTaskInsert = (payload: RealtimePostgresInsertPayload<{
  //   [key: string]: any;
  // }>) => {
  //   console.log("[Task inserted]: ", payload);
  // }
  type taskState = Database['public']['Enums']['taskState'];
  const changes = supabase
    .channel('schema-db-changes')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
      },
      async (payload: RealtimePostgresChangesPayload<{
        [key: string]: any;
      }>) => {
        switch (payload.table) {
          case 'task':
            if (payload.eventType == 'INSERT') {
              if (payload.new.state as taskState == "AWAITING_ATTACHMENTS") {
                console.log("[Serving task]: ", payload.new.id);
                const attachments: { path: string, content: string }[] = await Promise.all(
                  payload.new.attachments.map(async (attachment: typeof attachments[0]) => {
                    const content = await $`cat ${attachment.path}`;
                    console.log(`exit: ${content.exitCode}`);
                    return {
                      ...attachment,
                      content: content.text()
                    };
                  })
                );
                console.log(JSON.stringify(attachments));
                await supabase.from('task').update({ attachments: attachments }).eq('id', payload.new.id);
                try {
                  await axios.post("http://localhost:3000/queue", { task_id: payload.new.id, project_root: instance?.project_root }, { headers: { Authorization: token } });
                } catch (e: any) {
                  console.error("[Failed to queue task]", e['response']['status'], e['response']['statusText']);
                }
              }
            } else if (payload.eventType == 'UPDATE') {
              if (payload.new.state as taskState == 'COMPLETED') {
                const completion: OpenAI.Chat.Completions.ChatCompletion = payload.new.completion_response;
                completion.choices.forEach(choice => {
                  choice.message.tool_calls?.forEach(tool => {
                    if (tool.type == 'function') {
                      const snippetData: z.infer<typeof snippetSchema> = JSON.parse(tool.function.arguments);

                      switch (snippetData.actionType) {
                        case 'create': {
                          handleCreate(snippetData)
                          break;
                        }
                        case 'update': {
                          handleUpdate(snippetData);
                          break;
                        }
                        default:
                          {//do nothing 

                          }
                      }

                    }
                  });
                })
                console.log("!!type", typeof payload.new.completion_response);
              }
              console.log("!received update: ", payload);
            }
            break;
          default:
            // Ignore event
            break;
        }
      }
    )
    .subscribe()

  // // const taskSubscription = supabase
  // //   .channel('task')
  // //   .on('postgres_changes', { event: '*', schema: 'public', table: 'task' }, handleTaskInsert)
  // //   .subscribe();
  // subscriptions.push(taskSubscription);

  console.log(`⚡️[server]: TaskRunner Server is running at https://localhost:${port}`);
});

process.on('SIGINT', async () => {
  await onServerStop();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await onServerStop();
  process.exit(0);
});