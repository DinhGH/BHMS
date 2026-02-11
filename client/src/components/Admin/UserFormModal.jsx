import { FaHome } from "react-icons/fa";
import React, { useState } from "react";
import EyeToggle from "../../components/Admin/Eye.jsx";

export default function UserFormModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
  errors,
  isEditing = false,
}) {
  const [showPassword, setShowPassword] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl h-auto max-h-[90vh] p-8 overflow-y-auto rounded-lg shadow-lg relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 text-2xl"
        >
          ✕
        </button>

        <h2 className="text-3xl font-bold mb-2 text-gray-900">
          {isEditing ? "Edit User" : "Add New User"}
        </h2>
        <p className="text-gray-600 text-sm mb-6">
          Fill in the form below to {isEditing ? "update" : "create"} a user
        </p>

        {/* FORM GRID */}
        <div className="grid grid-cols-2 gap-4 mb-4">
          {/* EMAIL */}
          <div className="col-span-2">
            <label className="block mb-2 font-semibold text-gray-700">
              Email *
            </label>
            <input
              type="email"
              placeholder="user@example.com"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors?.email
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            {errors?.email && (
              <p className="text-red-500 text-sm mt-1">⚠ {errors.email}</p>
            )}
          </div>

          {/* PASSWORD */}
          <div className="col-span-2">
            <label className="block mb-2 font-semibold text-gray-700">
              Password {!isEditing && "*"}
            </label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder={
                  isEditing
                    ? "Leave blank to keep current"
                    : "Enter strong password"
                }
                className={`w-full px-4 py-2 border pr-10 rounded-lg focus:outline-none focus:ring-2 transition ${
                  errors?.password
                    ? "border-red-500 focus:ring-red-500"
                    : "border-gray-300 focus:ring-blue-500"
                }`}
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
              <EyeToggle
                show={showPassword}
                onToggle={() => setShowPassword((prev) => !prev)}
              />
            </div>
            {errors?.password && (
              <p className="text-red-500 text-sm mt-1">⚠ {errors.password}</p>
            )}
          </div>

          {/* FULL NAME */}
          <div className="col-span-2">
            <label className="block mb-2 font-semibold text-gray-700">
              Full Name *
            </label>
            <input
              type="text"
              name="fullName"
              autoComplete="name"
              placeholder="John Doe"
              className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 transition ${
                errors?.fullName
                  ? "border-red-500 focus:ring-red-500"
                  : "border-gray-300 focus:ring-blue-500"
              }`}
              value={form.fullName || ""}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
            />
            {errors?.fullName && (
              <p className="text-red-500 text-sm mt-1">⚠ {errors.fullName}</p>
            )}
          </div>

          {/* ROLE */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Role
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={form.role || "TENANT"}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
            >
              <option value="OWNER">Owner</option>
              <option value="ADMIN">Admin</option>
            </select>
          </div>

          {/* STATUS */}
          <div>
            <label className="block mb-2 font-semibold text-gray-700">
              Status
            </label>
            <select
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition"
              value={form.status || "ACTIVE"}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <option value="ACTIVE">Active</option>
              <option value="BLOCKED">Blocked</option>
            </select>
          </div>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3 mt-8 pt-6 border-t">
          <button
            onClick={onSubmit}
            className="flex-1 px-6 py-2 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition shadow-md"
          >
            {isEditing ? "Update" : "Create"} User
          </button>
          <button
            onClick={onClose}
            className="flex-1 px-6 py-2 border-2 border-gray-300 text-gray-700 font-semibold rounded-lg hover:bg-gray-50 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
