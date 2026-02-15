export interface HarmonyOSDevice {
  udid: string;
  status: string;
}

export interface ProjectInfo {
  bundleName: string;
  versionCode: number;
  versionName: string;
  minCompatibleVersionCode?: number;
  targetAPIVersion?: number;
  apiReleaseType?: string;
  modules?: string[];
}

export interface ModuleInfo {
  name: string;
  type: 'HAP' | 'HSP' | 'HAR' | 'unknown';
  path: string;
  srcPath?: string;
}

export interface BuildOutput {
  hasOutputs: boolean;
  outputDir: string;
  files: string[];
  haps: string[];
  hsps: string[];
}

export interface InstalledApp {
  bundleName: string;
  versionCode?: string;
  versionName?: string;
  uid?: string;
  gids?: string;
  installTime?: string;
  updateTime?: string;
}

export interface AppInfo extends InstalledApp {
  isSystemApp?: boolean;
  isRemovable?: boolean;
  moduleInfo?: string[];
}
