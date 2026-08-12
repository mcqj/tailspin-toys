import { and, asc, eq, inArray } from 'drizzle-orm';
import type { Database } from './db';
import { games, categories, publishers } from '../../db/schema';
import type { Game } from '../types/game';

/** Filters that can be applied to the game listing. */
export interface GameFilters {
    /** Category identifiers matched with OR semantics. */
    categoryIds?: readonly number[];
    /** Publisher identifier that must match. */
    publisherId?: number;
}

const gameSelection = {
    id: games.id,
    title: games.title,
    description: games.description,
    starRating: games.starRating,
    categoryId: categories.id,
    categoryName: categories.name,
    publisherId: publishers.id,
    publisherName: publishers.name,
};

type GameSelectionRow = {
    id: number;
    title: string;
    description: string;
    starRating: number | null;
    categoryId: number | null;
    categoryName: string | null;
    publisherId: number | null;
    publisherName: string | null;
};

function mapGame(row: GameSelectionRow): Game {
    return {
        id: row.id,
        title: row.title,
        description: row.description,
        starRating: row.starRating,
        category:
            row.categoryId !== null && row.categoryName !== null
                ? { id: row.categoryId, name: row.categoryName }
                : null,
        publisher:
            row.publisherId !== null && row.publisherName !== null
                ? { id: row.publisherId, name: row.publisherName }
                : null,
    };
}

function baseGamesQuery(db: Database) {
    return db
        .select(gameSelection)
        .from(games)
        .leftJoin(categories, eq(games.categoryId, categories.id))
        .leftJoin(publishers, eq(games.publisherId, publishers.id));
}

/**
 * Lists every game with its category and publisher, ordered by title.
 *
 * @param db - Caller-provided database connection used by production code or tests.
 * @returns All games in deterministic title order.
 */
export async function getAllGames(db: Database): Promise<Game[]> {
    const rows = await baseGamesQuery(db).orderBy(asc(games.title));
    return rows.map(mapGame);
}

/**
 * Lists games matching the selected categories and publisher.
 *
 * Multiple category identifiers use OR semantics, while a publisher filter is
 * combined with the category selection using AND semantics.
 *
 * @param db - Caller-provided database connection used by production code or tests.
 * @param filters - Category and publisher identifiers to match.
 * @returns Matching games in deterministic title order.
 */
export async function getFilteredGames(
    db: Database,
    filters: GameFilters,
): Promise<Game[]> {
    const conditions = [];

    if (filters.categoryIds?.length) {
        conditions.push(inArray(games.categoryId, filters.categoryIds));
    }

    if (filters.publisherId !== undefined) {
        conditions.push(eq(games.publisherId, filters.publisherId));
    }

    const query = baseGamesQuery(db);
    const rows = conditions.length
        ? await query.where(and(...conditions)).orderBy(asc(games.title))
        : await query.orderBy(asc(games.title));

    return rows.map(mapGame);
}

/**
 * Lists all game identifiers in title order.
 *
 * @param db - Caller-provided database connection used by production code or tests.
 * @returns Game identifiers in deterministic title order.
 */
export async function getAllGameIds(db: Database): Promise<number[]> {
    const rows = await db.select({ id: games.id }).from(games).orderBy(asc(games.title));
    return rows.map((row) => row.id);
}

/**
 * Finds a game with its category and publisher.
 *
 * @param db - Caller-provided database connection used by production code or tests.
 * @param id - Numeric identifier of the game to find.
 * @returns The matching game, or `null` when it does not exist.
 */
export async function getGameById(db: Database, id: number): Promise<Game | null> {
    const row = await baseGamesQuery(db).where(eq(games.id, id)).get();
    return row ? mapGame(row) : null;
}
