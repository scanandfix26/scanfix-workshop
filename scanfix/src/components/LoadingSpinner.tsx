export default function LoadingSpinner({ text = 'Loading…' }: { text?: string }) {
  return (
    <div className="flex-1 flex flex-col items-center justify-center min-h-screen bg-dark gap-4">
      <div className="w-16 h-16 rounded-2xl overflow-hidden bg-yellow/10">
        <img src="/logo.png" alt="Scan & Fix" className="w-full h-full object-contain p-1" />
      </div>
      <div className="w-8 h-8 border-4 border-yellow border-t-transparent rounded-full animate-spin" />
      <p className="text-gray-400 text-sm">{text}</p>
    </div>
  );
}
