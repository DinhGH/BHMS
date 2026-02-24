import React, { useEffect, useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import UserFormModal from "../../components/Admin/UserFormModal.jsx";
import Pagination from "../../components/Admin/Pagination.jsx";
import SearchInput from "../../components/Admin/SearchInput.jsx";
import api from "../../server/api.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});

  const pageSize = 10;

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    role: "TENANT",
    status: "ACTIVE",
  });

  const defaultForm = { ...form };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");

      const usersData = Array.isArray(res) ? res : res?.data;

      setUsers(usersData);
    } catch {
      setUsers([]);
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  // Pagination
  const filteredUsers = users
    .filter((u) => {
      if (filter === "active") return u.status === "ACTIVE";
      if (filter === "blocked") return u.status === "BLOCKED";

      if (filter === "inactive") {
        const sixMonthsAgo = new Date();
        sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
        return u.active === "NO" && new Date(u.createdAt) < sixMonthsAgo;
      }

      return true;
    })
    .filter(
      (u) =>
        u.fullName?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase()),
    );

  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
  // Pagination
  const handleSubmit = async () => {
    const newErrors = {};

    // EMAIL
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    // PASSWORD (required when creating, optional when editing)
    if (!editingId) {
      const strongPwd =
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[^\s]{8,}$/;
      if (!form.password) {
        newErrors.password = "Password is required";
      } else if (!strongPwd.test(form.password)) {
        newErrors.password =
          "Password ≥ 8 chars, include upper, lower, number & special char";
      }
    } else {
      // Khi edit: nếu có nhập password mới thì validate
      if (form.password) {
        const strongPwd =
          /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[^\s]{8,}$/;
        if (!strongPwd.test(form.password)) {
          newErrors.password =
            "Password ≥ 8 chars, include upper, lower, number & special char";
        }
      }
    }

    // FULL NAME
    if (!form.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (!/^[\p{L} .'-]+$/u.test(form.fullName)) {
      newErrors.fullName = "Full name contains invalid characters";
    }

    // Nếu có lỗi → dừng
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear lỗi
    setErrors({});

    try {
      const payload = { ...form };

      // Khi edit: nếu không nhập password mới thì xóa field password khỏi payload
      if (editingId && !payload.password) {
        delete payload.password;
      }

      if (editingId) {
        await api.put(`/api/users/${editingId}`, payload);
      } else {
        await api.post("/api/users/add", payload);
      }

      setOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      fetchUsers();
      alert("Save successful!");
    } catch (err) {
      console.error("Save error:", err);
      alert("Save failed: " + (err.message || "Unknown error"));
    }
  };

  const startEdit = (user) => {
    setForm({
      email: user.email || "",
      password: "",
      fullName: user.fullName || "",
      role: user.role || "TENANT",
      status: user.status || "ACTIVE",
    });
    setEditingId(user.id);
    setOpen(true);
  };

  const handleOpenAdd = () => {
    setForm({
      email: "",
      password: "",
      fullName: "",
      role: "TENANT",
      status: "ACTIVE",
    });
    setEditingId(null);
    setErrors({});
    setOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="flex-1 p-4 sm:p-6 lg:p-8 overflow-auto">
        {/* Title */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
          <h1 className="text-2xl font-semibold">Users</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-semibold shadow-md transition w-full sm:w-auto"
            onClick={handleOpenAdd}
          >
            + Add New User
          </button>
        </div>

        {/* Tabs */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-6">
          <div className="inline-flex items-center gap-2 p-1 bg-gray-100 rounded-lg">
            {[
              ["all", "All"],
              ["active", "Active"],
              ["blocked", "Blocked"],
              ["inactive", "Not Active in 6 months"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-all whitespace-nowrap ${
                  filter === key
                    ? "bg-white text-blue-600 shadow-sm"
                    : "text-gray-600 hover:text-gray-900 hover:bg-white/50"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="flex">
            <div className="w-full sm:w-64">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-md shadow-sm overflow-hidden">
          <div className="max-h-[calc(100vh-260px)] sm:max-h-[calc(100vh-280px)] overflow-y-auto overflow-x-auto">
            <table className="w-full text-sm min-w-160">
              <thead className="bg-gray-50 border-b sticky top-0 z-10">
                <tr className="text-left text-gray-500">
                  <th className="px-4 py-3">User</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3 hidden md:table-cell">Role</th>
                  <th className="px-4 py-3 hidden lg:table-cell">
                    Date Created Account
                  </th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.map((u) => (
                  <tr
                    key={u.id}
                    className="border-b last:border-none hover:bg-gray-50"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {u.fullName || "User Name"}
                      </div>
                      <div className="text-xs text-gray-400">Address</div>
                    </td>

                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3 hidden md:table-cell">{u.role}</td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      {new Date(u.createdAt).toLocaleDateString()}
                    </td>

                    <td className="px-4 py-3">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-semibold ${
                          u.status === "ACTIVE"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {u.status}
                      </span>
                    </td>

                    <td className="px-4 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button
                          className="px-3 py-1 rounded bg-blue-500 text-white text-xs"
                          onClick={() => startEdit(u)}
                        >
                          Edit
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* User Form Modal */}
        <UserFormModal
          open={open}
          onClose={() => {
            setOpen(false);
            setEditingId(null);
            setErrors({});
          }}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          errors={errors}
          isEditing={!!editingId}
        />

        {/* Pagination */}
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={setCurrentPage}
        />
      </div>
    </div>
  );
}
