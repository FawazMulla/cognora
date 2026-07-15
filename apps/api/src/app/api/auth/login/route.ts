import { NextResponse } from "next/server";
import { loginSchema } from "../../../../lib/validators/auth";
import { supabase } from "../../../../lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = loginSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.format() },
        { status: 400 }
      );
    }

    const { email, password } = parsed.data;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError || !authData.session) {
      return NextResponse.json({ error: authError?.message || "Login failed" }, { status: 401 });
    }

    // Return signed session + refresh tokens in Set-Cookie headers
    const cookieStore = cookies();
    cookieStore.set("sb-access-token", authData.session.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: authData.session.expires_in,
    });

    cookieStore.set("sb-refresh-token", authData.session.refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return NextResponse.json({ 
      message: "Login successful", 
      session: {
        access_token: authData.session.access_token,
        refresh_token: authData.session.refresh_token,
        user_id: authData.session.user.id
      }
    }, { status: 200 });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
