import React, { useEffect, useState } from "react";

export default function AdminDashBoard() {
	const [dashboard, setDashboard] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");

	useEffect(() => {
		const fetchDashboard = async () => {
			try {
				const baseUrl =
					import.meta.env.VITE_API_URL || "http://localhost:3000";
				const apiBase = baseUrl.endsWith("/api")
					? baseUrl
					: `${baseUrl}/api`;
				const res = await fetch(`${apiBase}/users/dashboard`);
				if (!res.ok) throw new Error("Failed to load dashboard");
				const data = await res.json();
				setDashboard(data);
			} catch {
				setError("Không thể tải dữ liệu dashboard");
			} finally {
				setLoading(false);
			}
		};

		fetchDashboard();
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
		<div className="p-6 space-y-6">
			<div className="flex items-center justify-between">
				<div>
					<h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
					<p className="text-sm text-gray-500">
						Overview of system operations and revenue
					</p>
				</div>
				<div className="text-sm text-gray-500">
					Updated: {formattedDate}
				</div>
			</div>

			{error && (
				<div className="text-sm text-red-500">{error}</div>
			)}

			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
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
					<p className="text-sm text-gray-500">Bookings today</p>
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

					<div className="h-64 flex items-end gap-3">
						{revenueByMonth.map((item) => (
							<div key={item.month} className="flex-1 flex flex-col items-center">
								<div className="w-full h-48 flex items-end justify-center">
									<div
										className="w-8 rounded-t-lg bg-blue-500/90 hover:bg-blue-600 transition-colors"
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
					<div className="space-y-4">
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
					<h2 className="text-lg font-semibold text-gray-900 mb-4">
						Monthly goals
					</h2>
					<div className="space-y-4">
						{[
							{
								label: "Occupancy rate",
								value: dashboard?.goals?.occupancyRate ?? 0,
								color: "bg-green-500",
							},
							{
								label: "5-star ratings",
								value: dashboard?.goals?.fiveStarRatings ?? 0,
								color: "bg-blue-500",
							},
							{
								label: "Returning customers",
								value: dashboard?.goals?.returningCustomers ?? 0,
								color: "bg-purple-500",
							},
						].map((item) => (
							<div key={item.label}>
								<div className="flex items-center justify-between text-sm text-gray-600 mb-2">
									<span>{item.label}</span>
									<span>{item.value}%</span>
								</div>
								<div className="h-2 bg-gray-100 rounded-full">
									<div
										className={`h-2 rounded-full ${item.color}`}
										style={{ width: `${item.value}%` }}
									/>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
}
