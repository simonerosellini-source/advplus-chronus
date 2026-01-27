// Logo Presency+ Component
export function Logo({ className = "w-80" }: { className?: string }) {
  return (
    <div className={`${className} mx-auto`}>
      <div className="flex items-center justify-center gap-6 bg-white p-6 rounded-lg">
        {/* Logo orologio circolare */}
        <div className="relative w-32 h-32 flex-shrink-0">
          <svg className="w-full h-full" viewBox="0 0 100 100">
            <defs>
              <linearGradient id="circleGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" style={{ stopColor: '#003366', stopOpacity: 1 }} />
                <stop offset="50%" style={{ stopColor: '#00B4D8', stopOpacity: 1 }} />
                <stop offset="100%" style={{ stopColor: '#90E0EF', stopOpacity: 1 }} />
              </linearGradient>
            </defs>

            {/* Arco circolare gradiente */}
            <circle
              cx="50"
              cy="50"
              r="40"
              fill="none"
              stroke="url(#circleGradient)"
              strokeWidth="12"
              strokeDasharray="220 251"
              strokeLinecap="round"
              transform="rotate(-90 50 50)"
            />

            {/* Lancetta dell'orologio */}
            <line
              x1="50"
              y1="50"
              x2="50"
              y2="20"
              stroke="#003366"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Centro orologio */}
            <circle cx="50" cy="50" r="4" fill="#003366" />
          </svg>
        </div>

        {/* Testo Presency+ e sottotitolo */}
        <div className="flex flex-col items-start">
          <h1 className="text-5xl font-bold text-primary leading-tight">
            Presency<span className="text-secondary">+</span>
          </h1>
          <p className="text-lg text-primary font-medium mt-1">
            by Advisory<span className="text-secondary">+</span>
          </p>
        </div>
      </div>
    </div>
  );
}

// Logo compatto per l'header
export function LogoCompact({ className = "h-12" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center gap-3`}>
      {/* Logo orologio circolare */}
      <div className="relative w-10 h-10">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#003366', stopOpacity: 1 }} />
              <stop offset="50%" style={{ stopColor: '#00B4D8', stopOpacity: 1 }} />
              <stop offset="100%" style={{ stopColor: '#90E0EF', stopOpacity: 1 }} />
            </linearGradient>
          </defs>
          <circle
            cx="50"
            cy="50"
            r="40"
            fill="none"
            stroke="url(#compactGradient)"
            strokeWidth="12"
            strokeDasharray="220 251"
            strokeLinecap="round"
            transform="rotate(-90 50 50)"
          />
          <line x1="50" y1="50" x2="50" y2="20" stroke="#003366" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="50" r="4" fill="#003366" />
        </svg>
      </div>

      {/* Testo Presency+ */}
      <div className="flex items-center gap-1">
        <span className="text-xl font-bold text-primary">Presency</span>
        <span className="text-xl font-bold text-secondary">+</span>
      </div>
    </div>
  );
}
