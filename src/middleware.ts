export { auth as middleware } from "@/lib/auth";

export const config = {
  matcher: ["/dashboard/:path*", "/competencies/:path*", "/action-items/:path*", "/evidence/:path*", "/api/ai/:path*"],
};
