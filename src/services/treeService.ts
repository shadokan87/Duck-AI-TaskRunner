import { $ } from 'bun';

export interface treeReport {
  type: 'report',
  directories?: number,
  files?: number
}

export interface treeResult {
  name: string;
  type: 'file' | 'directory';
  contents?: treeResult[];
}

type listResult = Array<treeResult | treeReport>;

export class TreeService {
  constructor(private cwd: string = process.env.PWD!) {

  }

  setCwd(path: string): TreeService {
    this.cwd = path;
    return this;
  }

  async list(option: { report: boolean } = {
    report: false
  }): Promise<listResult> {
    // console.log("++!cwd: ", this.cwd);
    // console.log("!pwd: ", process.env.PWD);
    const report = option.report ? '' : '--noreport';
    // console.log("!cwd", this.cwd)
    const result = await $`tree -J \
    ${report} \
    -I node_modules
    .
    `.cwd(this.cwd).text();
    // console.log("!result", result);
    const parsed = JSON.parse(result) as listResult;
    return parsed;
  }
}