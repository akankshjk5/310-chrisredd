/**
 * Publisher data-access helpers for the Tailspin Toys Crowd Funding platform.
 * Provides queries for retrieving publisher information from the database.
 */

import { asc } from 'drizzle-orm';
import { publishers } from '../../db/schema';
import type { Publisher } from '../types/game';
import type { Database } from './db';

/**
 * Returns all publishers ordered by name.
 *
 * @param db - The Drizzle database client.
 * @returns A promise that resolves to an array of publisher objects.
 */
export async function getAllPublishers(db: Database): Promise<Publisher[]> {
    const rows = await db
        .select({ id: publishers.id, name: publishers.name })
        .from(publishers)
        .orderBy(asc(publishers.name));

    return rows.map((row) => ({ id: row.id, name: row.name }));
}
