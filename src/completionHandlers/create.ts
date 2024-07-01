import OpenAI from "openai";
import { snippetSchema } from "../types/codeSnippet";
import { z } from "zod";
import { $ } from "bun";
import { instance } from "..";
import { join } from "path";

export async function handleCreate(snippet: z.infer<typeof snippetSchema>) {
  const { sourceCode, path } = snippet;
  const joinedPath = join(instance?.project_root!, path);
  const folderPath = joinedPath.substring(0, joinedPath.lastIndexOf('/'));
  try {
    const folderExists = await $`test -d ${folderPath}`;
    if (folderExists.exitCode != 0) {
      await $`mkdir -p ${folderPath}`;
    }
  } catch (e) {
    console.error("tested folder path: ", folderPath);
  }
  await $`echo ${sourceCode} > ${joinedPath}`;
}