import tree from 'tree-cli';

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
  constructor(private cwd: string = process.env.PWD!) { }

  setCwd(path: string): TreeService {
    this.cwd = path;
    return this;
  }

  async list(option: { report: boolean } = { report: false }): Promise<Tree.ITreeRoot> {
    const result = await tree({
      base: this.cwd,
      noreport: true,
      ignore: ['node_modules'],
      l: 1000
    });
    return result.data
  }
}