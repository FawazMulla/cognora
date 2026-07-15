import { NextResponse } from "next/server";
import { supabase } from "../../../../lib/supabase";
import { cookies } from "next/headers";

export async function POST() {
  try {
    const cookieStore = cookies();
    const accessToken = cookieStore.get("sb-access-token")?.value;

    if (accessToken) {
      // Sign out from Supabase (this invalidates the session on the server if using server-side auth, but with JWT we just drop cookies)
      await supabase.auth.signOut();
    }

    // Clear cookies
    cookieStore.delete("sb-access-token");
    cookieStore.delete("sb-refresh-token");

    return NextResponse.json({ message: "Logged out successfully" }, { status: 200 });
  } catch (error) {
    console.error("Logout error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
