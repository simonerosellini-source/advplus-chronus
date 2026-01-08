// Logo Advisory+ Component
export function Logo({ className = "w-64" }: { className?: string }) {
  return (
    <div className={`${className} mx-auto`}>
      <div className="flex items-center justify-center gap-4 bg-white p-6 rounded-lg">
        {/* Parte testuale ADVISORY+ */}
        <div className="bg-primary text-white px-6 py-4 rounded-lg">
          <div className="grid grid-cols-3 gap-x-3 text-xl font-bold leading-tight">
            <span>A</span>
            <span>D</span>
            <span>V</span>
            <span>I</span>
            <span>S</span>
            <span>O</span>
            <span>R</span>
            <span>Y</span>
            <span className="text-accent text-2xl">+</span>
          </div>
        </div>

        {/* Logo orologio circolare */}
        <div className="relative w-24 h-24">
          {/* Cerchio esterno blu */}
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
              stroke="white"
              strokeWidth="4"
              strokeLinecap="round"
            />

            {/* Centro orologio */}
            <circle cx="50" cy="50" r="4" fill="white" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Logo compatto per l'header
export function LogoCompact({ className = "h-12" }: { className?: string }) {
  return (
    <div className={`${className} flex items-center gap-3`}>
      <div className="bg-primary text-white px-3 py-2 rounded text-sm font-bold flex items-center gap-1">
        <span>ADVISORY</span>
        <span className="text-accent text-lg">+</span>
      </div>
      <div className="relative w-8 h-8">
        <svg className="w-full h-full" viewBox="0 0 100 100">
          <defs>
            <linearGradient id="compactGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" style={{ stopColor: '#003366', stopOpacity: 1 }} />
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
          <line x1="50" y1="50" x2="50" y2="20" stroke="white" strokeWidth="4" strokeLinecap="round" />
          <circle cx="50" cy="50" r="4" fill="white" />
        </svg>
      </div>
    </div>
  );
}
