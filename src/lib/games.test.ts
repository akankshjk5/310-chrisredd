import { describe, it, expect, beforeEach } from 'vitest';
import { createTestDatabase } from '../../db/test-helpers';
import { categories, publishers, games } from '../../db/schema';
import type { Database } from './db';
import {
    getAllGames,
    getAllGameIds,
    getGamesByFilters,
    getGamesByPublisher,
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

    it('returns games for a specific publisher', async () => {
        const [category] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'cat' })
            .returning({ id: categories.id });
        const [publisherOne] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'one' })
            .returning({ id: publishers.id });
        const [publisherTwo] = await db
            .insert(publishers)
            .values({ name: 'Pub Two', description: 'two' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            { title: 'Alpha', description: 'One', starRating: 4.0, categoryId: category.id, publisherId: publisherOne.id },
            { title: 'Beta', description: 'Two', starRating: 4.5, categoryId: category.id, publisherId: publisherTwo.id },
            { title: 'Gamma', description: 'Three', starRating: 5.0, categoryId: category.id, publisherId: publisherOne.id },
        ]);

        const filtered = await getGamesByPublisher(db, publisherOne.id);
        expect(filtered.map((game) => game.title)).toEqual(['Alpha', 'Gamma']);
    });

    it('combines category and publisher filters', async () => {
        const [strategy] = await db
            .insert(categories)
            .values({ name: 'Strategy', description: 'strategy' })
            .returning({ id: categories.id });
        const [puzzle] = await db
            .insert(categories)
            .values({ name: 'Puzzle', description: 'puzzle' })
            .returning({ id: categories.id });
        const [publisher] = await db
            .insert(publishers)
            .values({ name: 'Pub One', description: 'one' })
            .returning({ id: publishers.id });

        await db.insert(games).values([
            { title: 'Matching', description: 'matches both', starRating: 4, categoryId: strategy.id, publisherId: publisher.id },
            { title: 'Wrong Category', description: 'category differs', starRating: 4, categoryId: puzzle.id, publisherId: publisher.id },
        ]);

        const filtered = await getGamesByFilters(db, {
            categoryId: strategy.id,
            publisherId: publisher.id,
        });
        expect(filtered.map((game) => game.title)).toEqual(['Matching']);
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
});
