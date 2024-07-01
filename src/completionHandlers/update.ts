import OpenAI from "openai";
import { snippetSchema } from "../types/codeSnippet";
import { z } from "zod";
import { $ } from "bun";
import * as diff from "diff";
import { instance } from "..";
import { join } from "path";

export async function handleUpdate(snippet: z.infer<typeof snippetSchema>) {
  console.log("---- handleUpdate ---- \n");
  const {sourceCode, path} = snippet;
  const joinedPath = join(instance?.project_root!, path);
  const currentSourceCode = await $`cat ${joinedPath}`.text();
  console.log("!current: ", currentSourceCode);
  console.log("!new", sourceCode);
  
  const patch = diff.createTwoFilesPatch('file1', 'file2', currentSourceCode, sourceCode!);
  console.log("!patch: ", patch);
  
  const finalSourceCode = diff.applyPatch(currentSourceCode, patch);
  console.log("!final: ", finalSourceCode);
  
  // Save the final source code to the file
  await $`echo ${finalSourceCode} > ${joinedPath}`;
  
  console.log("Snippet Data: ", JSON.stringify(snippet, null, 2));
  console.log("---- handleUpdate ---- \n");
}