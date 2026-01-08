// Componenti Loading
export function LoadingSpinner({ className = 'h-8 w-8' }: { className?: string }) {
  return (
    <div className={`spinner ${className}`} role="status">
      <span className="sr-only">Caricamento...</span>
    </div>
  );
}

export function LoadingPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <LoadingSpinner className="h-12 w-12 text-primary mx-auto mb-4" />
        <p className="text-gray-600">Caricamento in corso...</p>
      </div>
    </div>
  );
}

export function LoadingOverlay() {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 shadow-xl">
        <LoadingSpinner className="h-12 w-12 text-primary mx-auto mb-4" />
        <p className="text-gray-600">Caricamento...</p>
      </div>
    </div>
  );
}

// Loading skeleton per le tabelle
export function TableSkeleton({ rows = 5, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4">
          {Array.from({ length: cols }).map((_, j) => (
            <div key={j} className="h-10 bg-gray-200 rounded flex-1" />
          ))}
        </div>
      ))}
    </div>
  );
}
