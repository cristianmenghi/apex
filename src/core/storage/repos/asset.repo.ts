/**
 * Asset Repository
 *
 * Encapsulates all I/O for documented assets discovered during
 * attack surface analysis. Assets are written to
 * `{rootPath}/assets/asset_{sanitizedName}_{timestamp}.json`.
 *
 * Uses fs/promises + Lock directly because files live within a
 * session's rootPath (not under the standard key-based store).
 */

import path from "path";
import fs from "fs/promises";

import { Lock } from "../../../util/lock";
import {
  DocumentedAssetRecordSchema,
  type DocumentedAssetRecord,
} from "../schemas/asset";

export interface AssetRepository {
  /**
   * Save a documented asset record to the session's assets directory.
   * Returns the absolute path to the written file.
   */
  save(rootPath: string, asset: DocumentedAssetRecord): Promise<string>;
}

export function createAssetRepo(): AssetRepository {
  return {
    async save(rootPath, asset) {
      const validated = DocumentedAssetRecordSchema.parse(asset);

      const assetsDir = path.join(rootPath, "assets");
      const sanitizedName = validated.assetName
        .toLowerCase()
        .replace(/[^a-z0-9-_.]/g, "_");
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const filename = `asset_${sanitizedName}_${timestamp}.json`;
      const fp = path.join(assetsDir, filename);

      using _ = await Lock.write(fp);
      await fs.mkdir(assetsDir, { recursive: true });
      await fs.writeFile(fp, JSON.stringify(validated, null, 2), "utf-8");

      return fp;
    },
  };
}
