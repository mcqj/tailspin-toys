---
description: 'Commenting, documentation, and TypeScript formatting standards'
applyTo: '**/*.{js,mjs,ts,astro}'
---

# Code Standards

## Comments Explain Intent

- Comment **why** code exists: capture intent, constraints, tradeoffs, or reasoning that is not clear from the implementation.
- Do not restate mechanics that the code already expresses. Delete comments that merely paraphrase the next line or block.
- Prefer clear names and small functions over comments that compensate for unclear code.
- Treat stale comments as bugs. When changing related code, update the comment so it remains accurate or remove it if the code is now self-explanatory.
- Use comments sparingly; straightforward code does not need narration.

## API Documentation

### Exported Data-Layer Functions

Every exported function in `db/` and `src/lib/` must have a TSDoc/JSDoc comment that:

- Summarizes the function's purpose and any important behavior or constraints.
- Includes an `@param` tag for every parameter.
- Includes an `@returns` tag describing the returned value, including for `Promise<void>`.
- Documents an injectable `db` parameter as the caller-provided database connection used by production code or tests.

```ts
/**
 * Finds a game and its related publisher and category.
 *
 * @param db - Caller-provided database connection used by pages or tests.
 * @param id - Numeric identifier of the game to find.
 * @returns The mapped game, or `null` when no matching game exists.
 */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    // Implementation
}
```

Keep documentation focused on the public contract. Do not repeat the function name, parameter types, or implementation line by line.

### Astro Component Props

Every reusable component in `src/components/` and `src/layouts/` must document its `Props` interface with a TSDoc/JSDoc summary. Document individual properties when their purpose, valid values, defaults, or behavior are not obvious from the name and type.

```astro
---
/** Props accepted by the game card component. */
interface Props {
    /** Game displayed by the card and linked to its detail page. */
    game: Game;
}
---
```

## TypeScript Formatting

- Use spaces rather than tabs and keep indentation consistent with the surrounding file.
- Use single quotes for strings; use another quote style only when it avoids escaping or a template literal is required.
- End statements with semicolons.
- Include trailing commas in multiline arrays, objects, imports, exports, parameters, and type members where the syntax allows.
- Keep one declaration per line and avoid manual whitespace alignment.
- Use explicit parameter and return types, especially in `db/` and `src/lib/`.

ESLint enforces single quotes, semicolons, and multiline trailing commas. Indentation remains a review convention because the configured ESLint toolchain does not provide TypeScript-aware indentation enforcement.
