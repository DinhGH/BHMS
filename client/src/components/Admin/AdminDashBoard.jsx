import React, { useEffect, useState } from "react";

export default function AdminDashBoard() {
	const [dashboard, setDashboard] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [refreshing, setRefreshing] = useState(false);

	const fetchDashboard = async (showLoader = true, forceRefresh = false) => {
		if (showLoader) {
			setLoading(true);
		}
		setError("");
		try {
			const baseUrl =
				import.meta.env.VITE_API_URL || "http://localhost:3000";
			const apiBase = baseUrl.endsWith("/api")
				? baseUrl
				: `${baseUrl}/api`;
			const params = new URLSearchParams({ t: Date.now().toString() });
			if (forceRefresh) {
				params.set("refresh", "true");
			}
			const res = await fetch(`${apiBase}/users/dashboard?${params.toString()}`);
			if (!res.ok) throw new Error("Failed to load dashboard");
			const data = await res.json();
			setDashboard(data);
		} catch {
			setError("Không thể tải dữ liệu dashboard");
		} finally {
			if (showLoader) {
				setLoading(false);
			}
			setRefreshing(false);
		}
	};

	useEffect(() => {
		fetchDashboard(true);
	}, []);

	const userStats = {
		active: dashboard?.summary?.activeUsers ?? 0,
		inactive: dashboard?.summary?.inactiveUsers ?? 0,
	};

	const totalUsers = userStats.active + userStats.inactive;
	const activePct = totalUsers
		? Math.round((userStats.active / totalUsers) * 100)
		: 0;
	const inactivePct = 100 - activePct;

	const revenueByMonth = dashboard?.revenueByMonth ?? [];
	const maxRevenue = revenueByMonth.length
		? Math.max(...revenueByMonth.map((item) => item.value))
		: 0;

	const currency = (value) =>
		new Intl.NumberFormat("vi-VN", {
			style: "currency",
			currency: "VND",
			maximumFractionDigits: 0,
		}).format(value * 1_000_000);

	const formattedDate = new Intl.DateTimeFormat("vi-VN").format(
		new Date()
	);

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50">
				<div className="flex flex-col items-center gap-3">
					<div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
					<div className="text-lg font-semibold text-gray-700 tracking-wide animate-pulse">
						Loading data...
					</div>
				</div>
			</div>
		);
	}

	return (
		<div className="p-4 sm:p-6 space-y-6">
			<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
					<p className="text-sm text-gray-500">
						Overview of system operations and revenue
					</p>
				</div>
				<div className="flex flex-wrap items-center gap-3 text-sm text-gray-500">
					<span>Updated: {formattedDate}</span>
					<button
						onClick={() => {
							setRefreshing(true);
							fetchDashboard(true, true);
						}}
						className="px-4 py-2 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-medium shadow-sm hover:shadow-md transition-all disabled:opacity-60 cursor-pointer hover:-translate-y-0.5"
						disabled={refreshing}
					>
						{refreshing ? "Refreshing..." : "Refresh"}
					</button>
				</div>
			</div>

			{error && (
				<div className="text-sm text-red-500">{error}</div>
			)}

			<div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
					<p className="text-sm text-gray-500">Total users</p>
					<div className="text-2xl font-bold text-gray-900">
						{totalUsers.toLocaleString("vi-VN")}
					</div>
					<div className="text-xs text-green-600 mt-2">
						+8.4% compared to last month
					</div>
				</div>
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
					<p className="text-sm text-gray-500">Active users</p>
					<div className="text-2xl font-bold text-gray-900">
						{userStats.active.toLocaleString("vi-VN")}
					</div>
					<div className="text-xs text-green-600 mt-2">
						{activePct}% of total users
					</div>
				</div>
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
					<p className="text-sm text-gray-500">Subscripted bought today</p>
					<div className="text-2xl font-bold text-gray-900">
						{dashboard?.summary?.bookingsToday ?? 0}
					</div>
					<div className="text-xs text-red-600 mt-2">-2.1% compared to yesterday</div>
				</div>
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
					<p className="text-sm text-gray-500">Monthly revenue</p>
					<div className="text-2xl font-bold text-gray-900">
						{currency(dashboard?.summary?.monthlyRevenue ?? 0)}
					</div>
					<div className="text-xs text-green-600 mt-2">
						+12.5% compared to last month
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-gray-900">
							Active user rate
						</h2>
						<span className="text-sm text-gray-500">Total: {totalUsers}</span>
					</div>

					<div className="flex items-center gap-6">
						<div className="flex-1 flex justify-center">
							<div className="relative w-60 h-60">
								<div
									className="absolute inset-0 rounded-full"
									style={{
										background: `conic-gradient(#22c55e 0% ${activePct}%, #ef4444 ${activePct}% 100%)`,
									}}
								/>
								<div className="absolute inset-7 bg-white rounded-full flex flex-col items-center justify-center shadow-inner">
									<span className="text-3xl font-bold text-gray-900">
										{activePct}%
									</span>
									<span className="text-sm text-gray-500">Active</span>
								</div>
							</div>
						</div>

						<div className="space-y-3">
							<div className="flex items-center gap-3">
								<span className="w-3 h-3 rounded-full bg-green-500" />
								<div>
									<p className="text-sm text-gray-700">Active</p>
									<p className="text-xs text-gray-500">
										{userStats.active.toLocaleString("vi-VN")} users
									</p>
								</div>
							</div>
							<div className="flex items-center gap-3">
								<span className="w-3 h-3 rounded-full bg-red-500" />
								<div>
									<p className="text-sm text-gray-700">Not active</p>
									<p className="text-xs text-gray-500">
										{userStats.inactive.toLocaleString("vi-VN")} users
									</p>
								</div>
							</div>
							<div className="mt-4 text-xs text-gray-500">
								Inactive: {inactivePct}% of total users
							</div>
						</div>
					</div>
				</div>

				<div className="xl:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
					<div className="flex items-center justify-between mb-4">
						<h2 className="text-lg font-semibold text-gray-900">
							Revenue by month
						</h2>
						<span className="text-sm text-gray-500">Unit: Million VND</span>
					</div>

					<div className="h-64 flex items-end gap-3 overflow-x-auto pb-2">
						{revenueByMonth.map((item) => (
							<div
								key={item.month}
								className="flex-1 min-w-[40px] sm:min-w-[48px] flex flex-col items-center"
							>
								<div className="w-full h-48 flex items-end justify-center">
									<div
										className="w-6 sm:w-8 rounded-t-lg bg-blue-500/90 hover:bg-blue-600 transition-colors"
										style={{
											height: maxRevenue
												? `${(item.value / maxRevenue) * 100}%`
												: "0%",
										}}
										title={`${item.month}: ${item.value} Million VND`}
									/>
								</div>
								<div className="text-xs text-gray-500 mt-2">{item.month}</div>
							</div>
						))}
					</div>

					<div className="mt-4 text-sm text-gray-600">
						Total annual revenue: {currency(dashboard?.totalAnnualRevenue ?? 0)}
					</div>
				</div>
			</div>

			<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
				<div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						Recent activity
					</h2>
					<div className="space-y-4 max-h-[360px] overflow-y-auto pr-1">
						{(dashboard?.recentActivity ?? []).map((item, index) => (
							<div
								key={index}
								className="flex items-center justify-between border-b border-gray-100 pb-3"
							>
								<div className="text-sm text-gray-700">{item.title}</div>
								<div className="text-xs text-gray-400">{item.time}</div>
							</div>
						))}
					</div>
				</div>

				<div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
					<div>
						<h2 className="text-lg font-semibold text-gray-900 mb-4">
							Report Admin status
						</h2>
						<div className="space-y-4">
							{[
								{
									label: "Reviewing",
									value: dashboard?.reportAdminSummary?.reviewing ?? 0,
									color: "bg-blue-500",
								},
								{
									label: "Fixing",
									value: dashboard?.reportAdminSummary?.fixing ?? 0,
									color: "bg-amber-500",
								},
								{
									label: "Fixed",
									value: dashboard?.reportAdminSummary?.fixed ?? 0,
									color: "bg-green-500",
								},
							].map((item) => (
								<div key={item.label}>
									<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
										<span>{item.label}</span>
										<span>{item.value}</span>
									</div>
									<div className="h-2 bg-gray-100 rounded-full">
										<div
											className={`h-2 rounded-full ${item.color}`}
											style={{ width: `${Math.min(item.value * 10, 100)}%` }}
										/>
									</div>
								</div>
							))}
						</div>
					</div>
				</div>
			</div>
			{refreshing && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-white/70">
					<div className="flex flex-col items-center gap-3">
						<div className="h-12 w-12 rounded-full border-4 border-blue-200 border-t-blue-600 animate-spin" />
						<div className="text-lg font-semibold text-gray-700 tracking-wide animate-pulse">
							Refreshing...
						</div>
					</div>
				</div>
			)}
		</div>
	);
}
