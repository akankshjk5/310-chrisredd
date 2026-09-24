/**
 * Category data-access helpers for the Tailspin Toys Crowd Funding platform.
 * Provides queries for retrieving category information from the database.
 */

import { asc } from 'drizzle-orm';
import { categories } from '../../db/schema';
import type { Category } from '../types/game';
import type { Database } from './db';

/**
 * Returns all categories ordered by name.
 *
 * @param db - The Drizzle database client.
 * @returns A promise that resolves to an array of category objects.
 */
export async function getAllCategories(db: Database): Promise<Category[]> {
    const rows = await db
        .select({ id: categories.id, name: categories.name })
        .from(categories)
        .orderBy(asc(categories.name));

    return rows.map((row) => ({ id: row.id, name: row.name }));
}
