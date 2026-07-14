import { NextResponse } from "next/server";
import { registerSchema } from "@/lib/validators/auth";
import { supabaseAdmin } from "@/lib/supabase";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import { users } from "@/db/schema";
import { env } from "@/lib/env";
import { eq } from "drizzle-orm";

const client = postgres(env.DATABASE_URL, { max: 10 });
const db = drizzle(client);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    // Check if user already exists in DB to preserve idempotence property (FR-001)
    const existingUser = await db.select().from(users).where(eq(users.email, email)).limit(1);
    if (existingUser.length > 0) {
      return NextResponse.json({ error: "Email already registered" }, { status: 409 });
    }

    // Register with Supabase Admin to auto-confirm if necessary, or just standard SDK
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (authError || !authData.user) {
      return NextResponse.json({ error: authError?.message || "Auth creation failed" }, { status: 400 });
    }

    // Insert into public.users table
    try {
      await db.insert(users).values({
        email: authData.user.email!,
        authId: authData.user.id,
      });
    } catch (dbError) {
      // If DB insert fails, delete the auth user to keep state consistent
      await supabaseAdmin.auth.admin.deleteUser(authData.user.id);
      console.error("DB Insert Error:", dbError);
      return NextResponse.json({ error: "Database error during registration" }, { status: 500 });
    }

    // Optionally login the user and set cookie here or let them call login
    // We will let the client call login to get the cookie, or we can issue a token
    return NextResponse.json({ message: "Registration successful" }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
