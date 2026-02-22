/**
 * Lazy singleton factory for all domain repositories.
 *
 * Usage:
 *   import { repos } from "@/core/storage/repos";
 *   const session = await repos.sessions.get(id);
 *
 * Each repository is instantiated on first access and reused for
 * the lifetime of the process. This avoids creating stores (and
 * their filesystem watchers) until they're actually needed.
 */

import { type SessionRepository, createSessionRepo } from "./session.repo";
import { type FindingRepository, createFindingRepo } from "./finding.repo";
import { type ConfigRepository, createConfigRepo } from "./config.repo";
import {
  type OperatorStateRepository,
  createOperatorStateRepo,
} from "./operator.repo";
import { type AssetRepository, createAssetRepo } from "./asset.repo";
import {
  type AttackSurfaceRepository,
  createAttackSurfaceRepo,
} from "./attack-surface.repo";
import { type AuthRepository, createAuthRepo } from "./auth.repo";
import { type PocRepository, createPocRepo } from "./poc.repo";
import { type MessageRepository, createMessageRepo } from "./message.repo";
import { type LogRepository, createLogRepo } from "./log.repo";

let _sessions: SessionRepository | undefined;
let _findings: FindingRepository | undefined;
let _config: ConfigRepository | undefined;
let _operatorState: OperatorStateRepository | undefined;
let _assets: AssetRepository | undefined;
let _attackSurface: AttackSurfaceRepository | undefined;
let _auth: AuthRepository | undefined;
let _pocs: PocRepository | undefined;
let _messages: MessageRepository | undefined;
let _logs: LogRepository | undefined;

export const repos = {
  get sessions(): SessionRepository {
    return (_sessions ??= createSessionRepo());
  },
  get findings(): FindingRepository {
    return (_findings ??= createFindingRepo());
  },
  get config(): ConfigRepository {
    return (_config ??= createConfigRepo());
  },
  get operatorState(): OperatorStateRepository {
    return (_operatorState ??= createOperatorStateRepo());
  },
  get assets(): AssetRepository {
    return (_assets ??= createAssetRepo());
  },
  get attackSurface(): AttackSurfaceRepository {
    return (_attackSurface ??= createAttackSurfaceRepo());
  },
  get auth(): AuthRepository {
    return (_auth ??= createAuthRepo());
  },
  get pocs(): PocRepository {
    return (_pocs ??= createPocRepo());
  },
  get messages(): MessageRepository {
    return (_messages ??= createMessageRepo());
  },
  get logs(): LogRepository {
    return (_logs ??= createLogRepo());
  },
};

// Re-export types for convenience
export type {
  SessionRepository,
  FindingRepository,
  ConfigRepository,
  OperatorStateRepository,
  AssetRepository,
  AttackSurfaceRepository,
  AuthRepository,
  PocRepository,
  MessageRepository,
  LogRepository,
};
