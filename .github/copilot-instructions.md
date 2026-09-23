# Copilot instructions

## Build, run, and validation

This is a dependency-free static browser project. There is no `package.json`, build step, automated test runner, or linter.

- Run the game with `python3 -m http.server 8000` from the repository root.
- Open `http://localhost:8000/` in a browser for manual validation.
- There is no automated single-test command. For a focused check, manually exercise the changed behavior in the browser; relevant behaviors include movement and jumping, coin collection, enemy defeat/collision, lives and invincibility, restart, reaching the goal, and responsive layout.

## Architecture

- `index.html` provides the page shell, canvas, HUD, end-state overlay, restart button, and control hints. The IDs in this file are the DOM API consumed by `script.js`.
- `script.js` is the complete game implementation. `level` contains immutable geometry and spawn data; `resetGame()` creates mutable per-run entities and state; `update()` handles input, frame-based physics, collisions, camera movement, score/lives, and win/loss transitions; `draw()` and its `draw*()` helpers render the scene; `loop()` runs update/render through `requestAnimationFrame`.
- The canvas uses a fixed internal coordinate space of `960 x 540`, while CSS scales it responsively to a 16:9 display. The world is `3200` units wide, and `game.camera` offsets world-space drawing. The status HUD is DOM-rendered and stays outside the camera transform.
- `style.css` owns the visual system and responsive layout: theme tokens in `:root`, the game shell/card/header/HUD, overlay and controls, and the `600px` breakpoint. The stylesheet also imports the project’s Google Fonts.

## Repository-specific conventions

- Keep the project as plain browser code. Do not add a framework, bundler, or dependency unless the requirements explicitly change.
- Preserve the HTML/JavaScript DOM contract. When changing an element ID, update every matching selector and event binding in `script.js`.
- Add platforms, coins, and enemy spawn points to `level`; create their mutable runtime copies in `resetGame()`. Never mutate the static spawn arrays during play.
- Keep simulation and rendering separate: gameplay changes belong in `update()` or state-transition helpers, and drawing belongs in `draw*()` helpers. Use `hit()` for axis-aligned collisions and `finish()`/`takeDamage()` for end-state transitions.
- Use fixed canvas/world coordinates for gameplay. Apply `game.camera` to world-space rendering and keep fixed HUD text after the camera transform is restored.
- 表示する説明文やプレイヤー向けのメッセージは日本語にする。
- Follow the existing compact vanilla-JS style and four-space indentation. Player-facing copy is primarily Japanese, while branding and status labels use the established English arcade style.
- Reuse the existing CSS custom properties and palette, and preserve the responsive header, controls, canvas scaling, and 16:9 aspect ratio.
