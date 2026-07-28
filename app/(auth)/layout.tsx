import Image from "next/image";

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

      <div className="relative flex flex-1 flex-col overflow-hidden">{children}</div>
    </div>
  );
}
