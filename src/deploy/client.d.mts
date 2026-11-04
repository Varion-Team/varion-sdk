import type { KeyObject, createPrivateKey } from 'node:crypto';

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | readonly JsonValue[]
  | {
      readonly [key: string]: JsonValue | undefined;
    };
export type Environment = Readonly<Record<string, string | undefined>>;
export type SigningKey = KeyObject | Parameters<typeof createPrivateKey>[0];
export type DeployEnvironment = 'test' | 'prod' | `preview-${string}`;
export type DeployAction = 'activate' | 'rollback';
export interface KeyOptions {
  env?: Environment;
  dir?: string;
}
export interface KeyDescription {
  publicKey: string;
  fingerprint: string;
  source: 'env' | 'file';
  trust: string;
  dir?: string;
  privateKeyPath?: string;
  publicKeyPath?: string;
}
export interface DeployRequest {
  action: DeployAction;
  env: DeployEnvironment;
  issuedAt: string;
  nonce: string;
  project: string;
  releaseId: string;
  serverId: string;
  sha256: string;
}
export interface BuildDeployRequestOptions {
  action?: DeployAction;
  env: string;
  project: string;
  releaseId: string;
  serverId: string;
  sha256: string;
  issuedAt?: string;
  nonce?: string;
}
export interface SignedDeployRequest {
  request: DeployRequest;
  signature: string;
  publicKey: string;
}
export interface CabinetOptions {
  cabinetUrl: string;
  allowInsecureHttp?: boolean;
}
export interface TargetOptions extends CabinetOptions {
  serverId: string;
  token: string;
}
export interface SigningOptions {
  keysDir?: string;
  privateKey?: SigningKey;
}
export interface DeployStatus {
  status: string;
  phase: string;
  [key: string]: unknown;
}
export interface UploadResult {
  releaseId: string;
  sha256: string;
  size: number;
  project: string;
  env: DeployEnvironment;
  existing: boolean;
}
export interface UploadOptions extends TargetOptions {
  bundlePath: string;
  retries?: number;
  onProgress?: (progress: { sent: number; total: number }) => void;
}
export interface RequestDeployOptions extends TargetOptions, SigningOptions {
  action?: DeployAction;
  env: string;
  project: string;
  releaseId: string;
  sha256: string;
}
export interface RequestedDeploy {
  deployId: string;
  status: string;
  request: DeployRequest;
  publicKey: string;
  fingerprint: string;
}
export interface WaitDeployOptions extends TargetOptions {
  deployId: string;
  intervalMs?: number;
  timeoutMs?: number;
  /** Status notification; its return value is ignored. */
  onStatus?: (status: DeployStatus) => void;
}
export interface DeployReleaseOptions extends Omit<UploadOptions, 'retries'>, SigningOptions {
  action?: DeployAction;
  wait?: boolean;
  timeoutMs?: number;
  intervalMs?: number;
  onStatus?: (status: DeployStatus) => void;
}
export interface Account {
  id: string;
  name: string;
}
export interface SavedLogin {
  token: string;
  account?: unknown;
  signedInAt?: unknown;
  [key: string]: unknown;
}
export interface LoginCode {
  userCode: string;
  verifyUrl: string;
  expiresIn: number;
}
export interface SignInOptions extends CabinetOptions {
  name?: string;
  intervalMs?: number;
  onCode?: (code: LoginCode) => unknown;
}

export const DEPLOY_ENV: RegExp;
export const RELEASE_ID: RegExp;
export const DEPLOY_TOKEN: RegExp;
export const CLI_TOKEN: RegExp;
export class DeployError extends Error {
  constructor(
    message: string,
    options?: { code?: string; status?: number; data?: unknown; cause?: unknown },
  );
  code: string;
  status: number;
  exitCode: 1;
  data?: unknown;
}
export function configDir(env?: Environment, platform?: string): string;
export function keysDir(env?: Environment, platform?: string): string;
export function keyFingerprint(publicKey: string): string;
export function showKey(options?: KeyOptions): KeyDescription;
export function initKeys(
  options?: KeyOptions & { force?: boolean },
): KeyDescription & { created: boolean; replaced?: string };
/** Throws TypeError for values that cannot be represented as canonical JSON. */
export function canonicalJson(value: unknown): string;
export function buildDeployRequest(options: BuildDeployRequestOptions): DeployRequest;
export function signDeployRequest(
  request: DeployRequest,
  options?: KeyOptions & { privateKey?: SigningKey },
): SignedDeployRequest;
export function verifyDeployRequest(envelope: unknown): boolean;
export function previewEnv(branch: string): DeployEnvironment;
/** Returns the cabinet's JSON object; unvalidated extension fields remain unknown. */
export function listReleases(
  options: TargetOptions & { retries?: number },
): Promise<Record<string, unknown>>;
export function uploadRelease(options: UploadOptions): Promise<UploadResult>;
export function requestDeploy(options: RequestDeployOptions): Promise<RequestedDeploy>;
export function getDeploy(options: TargetOptions & { deployId: string }): Promise<DeployStatus>;
export function waitDeploy(options: WaitDeployOptions): Promise<DeployStatus>;
export function deployRelease(
  options: DeployReleaseOptions,
): Promise<{ upload: UploadResult; deployId: string; final: DeployStatus | null }>;
export function cabinetBase(cabinetUrl: string, options?: { allowInsecureHttp?: boolean }): string;
export function loginFile(env?: Environment): string;
export function savedLogin(cabinetUrl: string, options?: { env?: Environment }): SavedLogin | null;
export function saveLogin(
  cabinetUrl: string,
  login: { token: string; account: unknown },
  options?: { env?: Environment; now?: Date },
): void;
export function forgetLogin(cabinetUrl: string, options?: { env?: Environment }): boolean;
export function signIn(options: SignInOptions): Promise<{ token: string; account: Account }>;
export function registerKey(
  options: CabinetOptions & { token: string; publicKey: string; name?: string },
): Promise<{ id: string; fingerprint: string }>;
export function getAccount(options: CabinetOptions & { token: string }): Promise<{
  account: Account;
  servers: Array<{ id: string; name: string; deployTest: boolean; deployProd: boolean }>;
}>;
