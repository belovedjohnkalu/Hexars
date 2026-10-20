// Server-only executable allowlist. Browser input selects an ID, never a path.
import { engineId, type EngineId } from './chessEngines';
const assets = {
  tactical: {
    identity: 'Tactical 0.9.0',
    asset: '/_cdn/static/9f65e48d-88fe-4aeb-b6dd-467b03953d57-tactical-0.9.0-linux-x64.bin',
    checksum: '33a4d360905b37806e16fe9709ec323b0e48fdd5ebd240adf7af9a76ebc71b93',
    size: 2222328,
  },
  positional: {
    identity: 'Positional 1.0.0',
    asset: '/_cdn/static/7a595edd-a309-42df-8989-28543cd6221a-positional-1.0.0-static-linux-x64.bin',
    checksum: '11dcd1f5fa62d6bc3025c51d480686b885ee6d245dd6b98723e257fe32181585',
    size: 2242808,
  },
  defensive: {
    identity: 'Defensive 1.0.0',
    asset: '/_cdn/static/21ae015c-47cb-45c7-b71d-273102b8da48-defensive-1.0.0-static-linux-x64.bin',
    checksum: '952090e0139b6d0ecd057d9517a1d94a0b395086706e0c145c791746fc891578',
    size: 2222328,
  },
  materialist: {
    identity: 'Materialist 1.0.0',
    asset: '/_cdn/static/39ed551e-1d0f-477f-afdb-479ff5a7174f-materialist-1.0.0-static-linux-x64.bin',
    checksum: 'c4fedd007e2bb691d8f8f7b6fc4b22add2382db00ac8d5ff8f4bc6f0ba2f8d5a',
    size: 2242808,
  },
  unconventional: {
    identity: 'Unconventional 1.0.0',
    asset: '/_cdn/static/d1e2ca35-1add-4217-a1ee-842a86fe0b0f-unconventional-1.0.0-static-linux-x64.bin',
    checksum: 'e7d8e6ec417d39ec304b3b5414b46612f23a7475121964babe4f50995a1fe279',
    size: 2246904,
  },
  universal: {
    identity: 'Universal 1.0.0',
    asset: '/_cdn/static/0802177b-0a09-42fd-b9bd-1ef52f88f305-universal-1.0.0-static-linux-x64.bin',
    checksum: '2de069ac6844e8c742c7dff857a9d0424b233a4f131ab8d32728a46ce09c3d59',
    size: 2222328,
  },
} satisfies Record<EngineId, {identity: string; asset: string; checksum: string; size: number}>;
export function nativeEngineAsset(value: unknown) { return assets[engineId(value)]; }
