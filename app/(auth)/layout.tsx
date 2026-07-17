import Link from "next/link";
import { APP_NAME, ROUTES } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      <Link href={ROUTES.home} className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-sm font-bold text-primary-foreground">
          E
        </span>
        <span className="text-lg font-semibold tracking-tight">{APP_NAME}</span>
      </Link>
      {children}
    </div>
  );
}
