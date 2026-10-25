// Legacy executable metadata supports saved games. Only Computer is presented
// for new games; native paths and asset checksums remain server-side.
export const engineIds = ['tactical', 'positional', 'defensive', 'materialist', 'unconventional', 'universal'] as const;
export type EngineId = typeof engineIds[number];
export const chessEngines = [
  { id: 'tactical', name: 'Tactical', color: 'blue' },
  { id: 'positional', name: 'Positional', color: 'mint' },
  { id: 'defensive', name: 'Defensive', color: 'lavender' },
  { id: 'materialist', name: 'Materialist', color: 'amber' },
  { id: 'unconventional', name: 'Unconventional', color: 'coral' },
  { id: 'universal', name: 'Universal', color: 'cyan' },
] as const;
export function isEngineId(value: unknown): value is EngineId {
  return engineIds.some(id => id === value);
}
export function engineId(value: unknown): EngineId {
  return isEngineId(value) ? value : 'universal';
}
export function engineName(value: unknown): string {
  return 'Computer';
}
