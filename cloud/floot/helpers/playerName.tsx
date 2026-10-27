// Legacy accounts may have used an email as their display name. Public Chess
// surfaces must never turn that into an accidental address disclosure.
export function playerName(value:string) {
  const name=value.trim();
  return !name||name.includes('@')?'Player':name;
}
