import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getFilteredGames,
    getGameById,
} from './games';

async function seedGames(db: Database, count: number): Promise<void> {
    const [category] = await db
        .insert(categories)
        .values({ name: 'Strategy', description: 'cat' })
        .returning({ id: categories.id });
    const [publisher] = await db
        .insert(publishers)
        .values({ name: 'Pub One', description: 'pub' })
        .returning({ id: publishers.id });

    // Insert titles in reverse-alphabetical order to prove ordering is applied.
    for (let i = count; i >= 1; i--) {
        await db.insert(games).values({
            title: `Game ${String(i).padStart(2, '0')}`,
            description: `Description ${i}`,
            starRating: 4.2,
            categoryId: category.id,
            publisherId: publisher.id,
        });
    }
}

describe('games data-access helpers', () => {
    let db: Database;

    beforeEach(async () => {
        db = await createTestDatabase();
    });

    it('returns all games ordered by title', async () => {
        await seedGames(db, 3);
        const all = await getAllGames(db);
        expect(all.map((g) => g.title)).toEqual(['Game 01', 'Game 02', 'Game 03']);
        expect(all[0].category).toEqual({ id: expect.any(Number), name: 'Strategy' });
        expect(all[0].publisher).toEqual({ id: expect.any(Number), name: 'Pub One' });
    });

    it('returns all game ids ordered by title', async () => {
        await seedGames(db, 3);
        const ids = await getAllGameIds(db);
        const all = await getAllGames(db);
        expect(ids).toEqual(all.map((g) => g.id));
    });

    it('fetches a single game by id', async () => {
        await seedGames(db, 2);
        const ids = await getAllGameIds(db);
        const game = await getGameById(db, ids[0]);
        expect(game?.title).toBe('Game 01');
    });

    it('returns null for a non-existent game', async () => {
        await seedGames(db, 2);
        expect(await getGameById(db, 99999)).toBeNull();
    });

    it('filters by one or more categories', async () => {
        const [strategy, puzzle] = await db
            .insert(categories)
            .values([
                { name: 'Strategy', description: 'cat' },
                { name: 'Puzzle', description: 'cat' },
            ])
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Publisher', description: 'pub' })
            .returning({ id: publishers.id });
        await db.insert(games).values([
            {
                title: 'Strategy Game',
                description: 'Description',
                categoryId: strategy.id,
                publisherId: publisher.id,
            },
            {
                title: 'Puzzle Game',
                description: 'Description',
                categoryId: puzzle.id,
                publisherId: publisher.id,
            },
        ]);

        const filtered = await getFilteredGames(db, {
            categoryIds: [strategy.id, puzzle.id],
        });

        expect(filtered.map((game) => game.title)).toEqual([
            'Puzzle Game',
            'Strategy Game',
        ]);
    });

    it('combines category and publisher filters', async () => {
        const [strategy, puzzle] = await db
            .insert(categories)
            .values([
                { name: 'Strategy', description: 'cat' },
                { name: 'Puzzle', description: 'cat' },
            ])
            .returning({ id: categories.id });
        const [firstPublisher, secondPublisher] = await db
            .insert(publishers)
            .values([
                { name: 'First Publisher', description: 'pub' },
                { name: 'Second Publisher', description: 'pub' },
            ])
            .returning({ id: publishers.id });
        await db.insert(games).values([
            {
                title: 'Matching Game',
                description: 'Description',
                categoryId: strategy.id,
                publisherId: firstPublisher.id,
            },
            {
                title: 'Wrong Publisher',
                description: 'Description',
                categoryId: strategy.id,
                publisherId: secondPublisher.id,
            },
            {
                title: 'Wrong Category',
                description: 'Description',
                categoryId: puzzle.id,
                publisherId: firstPublisher.id,
            },
        ]);

        const filtered = await getFilteredGames(db, {
            categoryIds: [strategy.id],
            publisherId: firstPublisher.id,
        });

        expect(filtered.map((game) => game.title)).toEqual(['Matching Game']);
    });

    it('returns every game when filters are empty', async () => {
        await seedGames(db, 2);

        const filtered = await getFilteredGames(db, {});

        expect(filtered.map((game) => game.title)).toEqual(['Game 01', 'Game 02']);
    });
});
