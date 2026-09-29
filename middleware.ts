import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

function secretKey(): Uint8Array {
  return new TextEncoder().encode(
    process.env.JWT_SECRET ?? "dev-secret-change-me"
  );
}

export async function middleware(req: NextRequest) {
  const token = req.cookies.get("portfolio_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", req.url));
  }
  try {
    await jwtVerify(token, secretKey());
    return NextResponse.next();
  } catch {
    return NextResponse.redirect(new URL("/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*"],
};
