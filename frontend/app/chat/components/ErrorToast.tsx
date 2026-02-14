interface ErrorToastProps {
  message: string;
  onClose: () => void;
}

export function ErrorToast({ message, onClose }: ErrorToastProps) {
  return (
    <div className="fixed top-4 right-4 z-50 max-w-sm">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg">
        <div className="flex items-start">
          <div className="flex-shrink-0">
            <span className="text-red-500 text-xl">⚠️</span>
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-red-800">{message}</p>
          </div>
          <div className="ml-4">
            <button
              onClick={onClose}
              className="text-red-400 hover:text-red-600 text-sm font-medium"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}