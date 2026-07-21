import Image from "next/image";
import Link from "next/link";
import { APP_NAME, ROUTES } from "@/lib/constants";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background md:flex-row">
      <div className="relative h-48 w-full shrink-0 overflow-hidden bg-sidebar sm:h-64 md:h-auto md:w-1/2 lg:w-3/5">
        <Image
          src="/images/theme/topbar-lab.png"
          alt=""
          fill
          sizes="(min-width: 768px) 60vw, 100vw"
          priority
          className="object-cover object-[center_30%]"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-sidebar/40 to-transparent" />
      </div>

      <div className="flex flex-1 flex-col items-center justify-center px-6 py-12">
        <Link href={ROUTES.home} className="mb-8">
          <span className="font-fredoka text-4xl font-semibold tracking-tight text-primary sm:text-5xl">
            {APP_NAME}
          </span>
        </Link>
        {children}
      </div>
    </div>
  );
}
