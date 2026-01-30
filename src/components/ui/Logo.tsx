import Image from 'next/image';

// Logo Presency+ Component
export function Logo({ className = "w-80" }: { className?: string }) {
  return (
    <div className={`${className} mx-auto`}>
      <div className="flex items-center justify-center bg-white p-6 rounded-lg">
        <Image
          src="/presency-plus-logo.png"
          alt="Presency+ Logo"
          width={320}
          height={120}
          className="object-contain"
          priority
        />
      </div>
    </div>
  );
}

// Logo compatto per l'header
export function LogoCompact({ className = "h-12" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center`}>
      <Image
        src="/presency-plus-logo.png"
        alt="Presency+ Logo"
        width={120}
        height={48}
        className="object-contain"
      />
    </div>
  );
}
