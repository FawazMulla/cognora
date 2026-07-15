import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const refreshToken = cookieStore.get("sb-refresh-token")?.value;

    if (!refreshToken) {
      return NextResponse.json({ error: "No refresh token provided" }, { status: 401 });
    }

    const { data: authData, error: authError } = await supabase.auth.refreshSession({
      refresh_token: refreshToken,
    });

    if (authError || !authData.session) {
      return NextResponse.json({ error: authError?.message || "Session refresh failed" }, { status: 401 });
    }

    // Set new cookies
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

    return NextResponse.json({ message: "Session refreshed" }, { status: 200 });
  } catch (error) {
    console.error("Refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
