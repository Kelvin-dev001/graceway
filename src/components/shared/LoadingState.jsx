export default function LoadingState({ message = 'Loading...' }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-gray-400">
      <div className="h-8 w-8 rounded-full border-2 border-gray-200 border-t-navy-500 animate-spin mb-3" />
      <p className="text-sm">{message}</p>
    </div>
  );
}
