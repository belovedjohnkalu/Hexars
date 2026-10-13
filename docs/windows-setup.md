# Windows development · VS Code and PowerShell

To play, open https://hexars.floot.app. No compiler or local manager is required. These instructions are for developing/testing the source.

## 1. Install prerequisites

Install [VS Code](https://code.visualstudio.com/), [Node.js LTS](https://nodejs.org/), [Git for Windows](https://git-scm.com/downloads/win), and [MSYS2](https://www.msys2.org/).

Open **MSYS2 UCRT64**, then run:

```sh
pacman -Syu
```

If instructed to close the terminal, reopen UCRT64 and run the update again. Then:

```sh
pacman -S mingw-w64-ucrt-x86_64-gcc
```

Use **PowerShell in VS Code** for the remaining steps. Verify:

```powershell
node --version
npm --version
git --version
& "C:\msys64\ucrt64\bin\g++.exe" --version
```

Node.js must be 22.12+; a current LTS is recommended. If `pacman` fails, confirm that the command was entered in the MSYS2 UCRT64 terminal, with ordinary hyphens and no pasted formatting.

## 2. Open the source

Extract `hexars-source.zip` into a new directory. Do not overwrite an existing project. For example, extracting into your home directory creates `$HOME\hexchess`.

```powershell
Set-Location "$HOME\hexchess"
code .
npm ci
npm run build:engine
```

The build script finds the default MSYS2 compiler, uses C++20 and optimization, and links the GCC and C++ runtimes statically. It generates `engines\engine-1\engine-one.exe` and the frontend board snapshot.

If the compiler was installed elsewhere:

```powershell
$env:HEXCHESS_CXX = "D:\msys64\ucrt64\bin\g++.exe"
npm run build:engine
```

If PowerShell blocks `npm.ps1`, use `npm.cmd` for these commands; no global execution-policy change is needed.

## 3. Test the native executable

```powershell
"ping" | & ".\engines\engine-1\engine-one.exe"
"id" | & ".\engines\engine-1\engine-one.exe"
```

Expect `pong` and `id Tactical 0.4`. A missing MSYS2 DLL can be resolved for the current terminal by adding its runtime directory:

```powershell
$env:Path = "C:\msys64\ucrt64\bin;$env:Path"
```

## 4. Run the optional local foundation

Terminal 1, from the project root:

```powershell
npm run manager
```

Expect `HexChess manager running at ws://127.0.0.1:8765`.

Terminal 2, from the same project root:

```powershell
npm run dev
```

For local diagnostics, open **http://localhost:5173/?foundation**. The website should show a 91-cell board, **Engine responding**, **Tactical 0.4**, and the measured round trip. The board can be inspected with mouse or keyboard. This diagnostic view covers communication and geometry. The default website uses the hosted cloud game.

Use Ctrl+C in each terminal to stop its service. The manager asks the engine to quit and terminates it if it fails to shut down.

## 5. Run regression checks

Stop running services first, then:

```powershell
npm test
npm run build
```

The integration tests use automatically assigned loopback ports. The manager implementation and executable support Windows, but Windows execution has not been tested in the Linux cloud workspace. Record the Windows results in `docs/progress.md` after running them.

## Troubleshooting

| Symptom | Action |
| --- | --- |
| Engine not compiled | Run `npm run build:engine` from the project root. |
| G++ not found | Verify the MSYS2 path or set `HEXCHESS_CXX`. |
| Manager offline | Start `npm run manager`, then select **Reconnect manager**. |
| Engine stopped or timed out | Stop and restart the manager. The foundation reports failures; automatic engine restart is a later milestone. |
| Port 8765 in use | Stop the previous manager instance. |
| Port 5173 in use | Stop the previous Vite instance. Vite deliberately refuses to change ports because the manager’s origin permissions are fixed. |
| npm cannot access registry | Check the terminal’s network access or proxy settings; keep TLS certificate validation enabled. |
| `npm run preview` has no engine connection | Preview serves the static build without the development WebSocket proxy. Use `npm run dev` for this local milestone. |
