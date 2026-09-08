import {NextRequest, NextResponse} from "next/server";

const SESSION_COOKIE_NAME = "qbms_session";
const PUBLIC_PREFIXES = ["/login", "/activate"];

function isPublicPath(pathname: string) {
  return PUBLIC_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );
}

export default function proxy(request: NextRequest) {
  const {pathname, search} = request.nextUrl;
  const hasSessionCookie = Boolean(
    request.cookies.get(SESSION_COOKIE_NAME)?.value
  );

  // Login/activation stay public. These pages validate the server-side
  // session/invitation before deciding where the user should go next.
  if (isPublicPath(pathname)) {
    return NextResponse.next();
  }

  if (!hasSessionCookie) {
    const loginUrl = new URL("/login", request.url);
    const requestedPath = `${pathname}${search}`;

    if (requestedPath !== "/") {
      loginUrl.searchParams.set("next", requestedPath);
    }

    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico)$).*)",
  ],
};
