// Public metadata only. Executable paths and asset checksums stay server-side.
export const engineIds = ['tactical', 'positional', 'defensive'] as const;
export type EngineId = typeof engineIds[number];
export const chessEngines = [
  { id: 'tactical', name: 'Tactical', color: 'blue' },
  { id: 'positional', name: 'Positional', color: 'mint' },
  { id: 'defensive', name: 'Defensive', color: 'lavender' },
] as const;
export function isEngineId(value: unknown): value is EngineId {
  return engineIds.some(id => id === value);
}
export function engineId(value: unknown): EngineId {
  return isEngineId(value) ? value : 'tactical';
}
export function engineName(value: unknown): string {
  return chessEngines.find(engine => engine.id === engineId(value))!.name;
}
