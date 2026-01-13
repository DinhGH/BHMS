import React, { useEffect, useState } from "react";
import { Search, MoreHorizontal } from "lucide-react";
import UserFormModal from "../../components/Admin/UserFormModal.jsx";
import Pagination from "../../components/Admin/Pagination.jsx";
import SearchInput from "../../components/Admin/SearchInput.jsx";
import api from "../../services/api.js";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState([]);
  const [open, setOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [errors, setErrors] = useState({});

  const pageSize = 10;

  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    gender: "MALE",
    phone: "",
    provider: "LOCAL",
    role: "TENANT",
    status: "NO_RENTING",
    active: "YES",
  });

  const defaultForm = { ...form };

  const fetchUsers = async () => {
    try {
      const res = await api.get("/api/users");

      const usersData = Array.isArray(res) ? res : res?.data;

      setUsers(usersData);
    } catch {
      alert("Load users failed");
    }
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchUsers();
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSelected([]);
  }, [filter, search, currentPage]);

  // Pagination
  const filteredUsers = users
    .filter((u) => {
      if (filter === "renting") return u.status === "RENTING";
      if (filter === "noRenting") return u.status === "NO_RENTING";

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
        u.email?.toLowerCase().includes(search.toLowerCase())
    );

  const toggleAll = () => {
    setSelected(
      selected.length === filteredUsers.length
        ? []
        : filteredUsers.map((u) => u.id)
    );
  };
  const totalPages = Math.ceil(filteredUsers.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + pageSize);
  // Pagination
  const handleDelete = async () => {
    if (selected.length === 0) return;

    if (!window.confirm(`Delete ${selected.length} user(s)?`)) return;

    try {
      await api.delete("/api/users", { ids: selected });

      setUsers((prev) => prev.filter((u) => !selected.includes(u.id)));
      alert("Deleted successfully");
      setSelected([]);
    } catch {
      alert("Delete failed");
    }
  };
  const handleSubmit = async () => {
    const newErrors = {};

    // EMAIL
    if (!form.email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      newErrors.email = "Invalid email format";
    }

    // PASSWORD
    if (
      !/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9])[^\s]{8,}$/.test(
        form.password
      )
    ) {
      newErrors.password =
        "Password ≥ 8 chars, include upper, lower, number & special char";
    }
    // FULL NAME
    if (!form.fullName?.trim()) {
      newErrors.fullName = "Full name is required";
    } else if (form.fullName.trim().length < 2) {
      newErrors.fullName = "Full name must be at least 2 characters";
    } else if (!/^[\p{L} .'-]+$/u.test(form.fullName)) {
      newErrors.fullName = "Full name contains invalid characters";
    }

    // PHONE
    if (!form.phone?.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\d{10}$/.test(form.phone)) {
      newErrors.phone = "Phone number must be exactly 10 digits";
    }

    // Nếu có lỗi → dừng
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Clear lỗi
    setErrors({});

    try {
      await api.post("/api/users/add", form);

      setOpen(false);
      setForm({
        email: "",
        password: "",
        fullName: "",
        gender: "MALE",
        phone: "",
        provider: "LOCAL",
        role: "TENANT",
        status: "NO_RENTING",
        active: "YES",
      });

      fetchUsers();
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="flex h-screen bg-[#f5f6f8]">
      <div className="flex-1 p-8 overflow-auto">
        {/* Title */}
        <h1 className="text-2xl font-semibold mb-6">Users</h1>

        {/* Tabs */}
        <div className="flex justify-between border-b mb-6 ">
          <div className="flex items-center gap-6 text-sm">
            {[
              ["all", "All"],
              ["renting", "Renting"],
              ["noRenting", "No Renting"],
              ["inactive", "Not Active in 6 months"],
            ].map(([key, label]) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`pb-3 ${
                  filter === key
                    ? "border-b-2 border-blue-600 text-blue-600 font-medium"
                    : "text-gray-500"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          {/* Search */}
          <div className="flex  mb-4">
            <div className="w-64">
              <SearchInput
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-md shadow-sm">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr className="text-left text-gray-500">
                <th className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={
                      selected.length === filteredUsers.length &&
                      filteredUsers.length > 0
                    }
                    onChange={toggleAll}
                  />
                </th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Date Created Account</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Active</th>
                <th />
              </tr>
            </thead>
            <tbody>
              {paginatedUsers.map((u) => (
                <tr
                  key={u.id}
                  className="border-b last:border-none hover:bg-gray-50"
                >
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.includes(u.id)}
                      onChange={() =>
                        setSelected((prev) =>
                          prev.includes(u.id)
                            ? prev.filter((i) => i !== u.id)
                            : [...prev, u.id]
                        )
                      }
                    />
                  </td>

                  <td className="px-4 py-3">
                    <div className="font-medium">
                      {u.fullName || "User Name"}
                    </div>
                    <div className="text-xs text-gray-400">Address</div>
                  </td>

                  <td className="px-4 py-3">{u.email}</td>
                  <td className="px-4 py-3">{u.role}</td>
                  <td className="px-4 py-3">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>

                  <td className="px-4 py-3">{u.status}</td>

                  <td className="px-4 py-3">
                    <span className={`px-3 py-1 rounded-full text-xs `}>
                      {u.active}
                    </span>
                  </td>

                  <td className="px-4 py-3 text-right">
                    <MoreHorizontal className="w-4 h-4 text-gray-500 cursor-pointer" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Bottom actions */}
        <div className="flex justify-between items-center mt-6">
          <button
            className="bg-gray-300 hover:bg-blue-600 text-white px-6 py-2 rounded"
            onClick={() => {
              setForm(defaultForm);
              setOpen(true);
            }}
          >
            Add New
          </button>

          <button
            className={`px-6 py-2 rounded ${
              selected.length === 0
                ? "bg-gray-300 text-white cursor-not-allowed"
                : "bg-red-600 text-white"
            }`}
            disabled={selected.length === 0}
            onClick={handleDelete}
          >
            Delete
          </button>
        </div>

        {/* User Form Modal */}
        <UserFormModal
          open={open}
          onClose={() => setOpen(false)}
          onSubmit={handleSubmit}
          form={form}
          setForm={setForm}
          errors={errors}
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
