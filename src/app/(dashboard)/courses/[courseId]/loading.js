export default function CourseLoading() {
  return (
    <div className="flex flex-col gap-3">
      {[0, 1, 2].map((i) => (
        <div key={i} className="border border-gray-200 rounded-2xl overflow-hidden animate-pulse">
          <div className="p-4 bg-gray-50 h-16" />
        </div>
      ))}
    </div>
  );
}
