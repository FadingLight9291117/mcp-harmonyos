import { execSync } from "child_process";

export interface HdcOptions {
  deviceId?: string;
  timeout?: number;
}

/**
 * Execute an hdc command and return the output string.
 * If deviceId is provided, the command targets that device via `-t`.
 */
export function hdcExec(command: string, options: HdcOptions = {}): string {
  const { deviceId, timeout = 5000 } = options;
  const cmd = deviceId ? `hdc -t ${deviceId} ${command}` : `hdc ${command}`;
  return execSync(cmd, { encoding: "utf-8", timeout });
}
