import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface HdcOptions {
  deviceId?: string;
  timeout?: number;
}

/**
 * Execute an hdc command asynchronously and return stdout.
 * Args are passed as an argv array so no shell parsing occurs — values like
 * deviceId or bundleName cannot inject extra commands.
 */
export async function hdcExec(args: string[], options: HdcOptions = {}): Promise<string> {
  const { deviceId, timeout = 5000 } = options;
  const fullArgs = deviceId ? ["-t", deviceId, ...args] : args;
  const { stdout } = await execFileAsync("hdc", fullArgs, {
    encoding: "utf-8",
    timeout,
    maxBuffer: 10 * 1024 * 1024,
  });
  return stdout;
}
