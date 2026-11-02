import { db } from "../../../db";
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';

import { userPreferences } from '../../../db/schema';
import { env } from '../../../lib/env';


export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const prefs = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, userId))
      .limit(1);

    if (prefs.length === 0 || !prefs[0]) {
      return NextResponse.json(
        {
          preferences: {
            theme: 'system',
            readingDensity: 'standard',
            languagePreference: 'english',
          },
        },
        { status: 200 },
      );
    }

    return NextResponse.json({ preferences: prefs[0] }, { status: 200 });
  } catch (error) {
    console.warn('[preferences] GET falling back to default preferences:', error);
    return NextResponse.json(
      {
        preferences: {
          theme: 'system',
          readingDensity: 'standard',
          languagePreference: 'english',
        },
      },
      { status: 200 },
    );
  }
}

export async function POST(request: Request) {
  let body: {
    theme?: 'light' | 'dark' | 'system';
    readingDensity?: 'comfortable' | 'standard' | 'compact';
    languagePreference?: 'english' | 'hinglish';
  } = {};

  try {
    const userId = request.headers.get('x-user-id');
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    body = (await request.json()) as {
      theme?: 'light' | 'dark' | 'system';
      readingDensity?: 'comfortable' | 'standard' | 'compact';
      languagePreference?: 'english' | 'hinglish';
    };

    const [saved] = await db
      .insert(userPreferences)
      .values({
        userId,
        theme: body.theme || 'system',
        readingDensity: body.readingDensity || 'standard',
        languagePreference: body.languagePreference || 'english',
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          ...(body.theme && { theme: body.theme }),
          ...(body.readingDensity && { readingDensity: body.readingDensity }),
          ...(body.languagePreference && { languagePreference: body.languagePreference }),
          updatedAt: new Date(),
        },
      })
      .returning();

    return NextResponse.json({ preferences: saved }, { status: 200 });
  } catch (error) {
    console.warn('[preferences] POST falling back to memory response:', error);
    return NextResponse.json(
      {
        preferences: {
          theme: body.theme || 'system',
          readingDensity: body.readingDensity || 'standard',
          languagePreference: body.languagePreference || 'english',
          updatedAt: new Date().toISOString(),
        },
      },
      { status: 200 },
    );
  }
}

