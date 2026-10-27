import { RealtimeClient } from './RealtimeClient';

// One authenticated connection per document, shared by mounted features. A lease
// owns its listeners; releasing it never disconnects another feature. Account
// changes retire the old grant immediately, including during overlapping effects.
type Entry = { identity: string; client: RealtimeClient; references: number; connecting?: Promise<void>; closing?: ReturnType<typeof setTimeout> };
let active: Entry | undefined;

export function realtimeLease(userId: number | null) {
  const identity = String(userId ?? 'guest');
  if (active && active.identity !== identity) {
    clearTimeout(active.closing);
    active.client.close();
    active = undefined;
  }
  const entry = active ??= { identity, client: new RealtimeClient(), references: 0 };
  clearTimeout(entry.closing);
  entry.references++;
  let released = false;
  return {
    subscribe: entry.client.subscribe.bind(entry.client),
    onReconnect: entry.client.onReconnect.bind(entry.client),
    onStatus: entry.client.onStatus.bind(entry.client),
    connect: () => entry.connecting ??= entry.client.connect(),
    close: () => {
      if (released) return;
      released = true;
      if (--entry.references !== 0) return;
      entry.closing = setTimeout(() => {
        if (entry.references) return;
        entry.client.close();
        if (active === entry) active = undefined;
      }, 0);
    },
  };
}
