import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { bootStrap } from "./env";
import { Iservices, addService, services as servicesNonStatic } from "./services";
import z from "zod";
import minimist from "minimist";
import { UserResponse, createClient } from '@supabase/supabase-js';
import { Database } from "./types/supabase";
import { TreeService } from "./services/treeService";

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

let instance: taskRunenrType | undefined = undefined;
let user: UserResponse | undefined = undefined;
async function connectTaskRunner() {
  await supabase.from("taskRunner").delete().neq("id", -1);
  const insert = await supabase.from("taskRunner").insert([{connected: true, project_root: "/Users/shadokan87/duc-Kopilot/mocks/helloWorld"}]);
  return insert;
}
async function onServerStop() {
  if (!user)
    return ;
  await supabase.from('taskRunner').delete().neq('id', -1);
}

async function login() {
  const response = await supabase.auth.setSession({access_token: token, refresh_token: refresh});
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
  } catch(e) {
    console.error("[Login failed]: ", e);
    process.exit(1);
  }
  try {
    const connectionResponse = await connectTaskRunner();
    const findInstance = await supabase.from('taskRunner').select('*');
    if (findInstance.error) {
      //TODO: handle error
      console.error(findInstance.error);
      return ;
    }
    instance = findInstance.data[0];
    services.tree.setCwd(instance.project_root!);
    try {
      const tree = await services.tree.list();
      await supabase.from('taskRunner').update({tree: JSON.stringify(tree)}).eq('id', instance.id);
      console.log("!contents", tree);
    } catch (error) {
      console.error("Error listing tree contents: ", error);
    }
  } catch(e) {
    console.log("[Failed to connect]: ", e);
  }
  
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