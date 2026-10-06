"use client";

import { useSession } from "next-auth/react";
import { isDemoEmail } from "./demo";

export function useIsDemo() {
  const { data: session } = useSession();
  return isDemoEmail(session?.user?.email);
}
