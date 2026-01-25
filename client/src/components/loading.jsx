export default function Loading({ isLoading = false }) {
	if (!isLoading) {
		return null;
	}

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
			<div className="flex flex-col items-center gap-4 rounded-2xl bg-white/90 px-6 py-5 shadow-xl">
				<div className="h-10 w-10 animate-spin rounded-full border-4 border-slate-300 border-t-blue-600" />
				<p className="text-sm font-medium text-slate-700">Loading...</p>
			</div>
		</div>
	);
}
