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
}) {
  const [showPassword, setShowPassword] = useState(false);
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-full max-w-2xl h-auto max-h-screen p-6 overflow-y-auto relative">
        <div
          className="flex items-center mb-6 cursor-pointer"
          onClick={onClose}
        >
          <FaHome className="text-xl mr-2" />
          <span className="font-semibold text-lg">Back</span>
        </div>

        <h2 className="text-2xl font-semibold mb-6 text-center">Add User</h2>

        {/* EMAIL */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Email *</label>
          <input
            type="email"
            placeholder="Enter email"
            className={`w-full border p-2 rounded ${
              errors?.email ? "border-red-500" : ""
            }`}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {errors?.email && (
            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
          )}
        </div>

        {/* PASSWORD */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Password</label>

          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              placeholder="Enter password"
              className={`w-full border p-2 pr-10 rounded ${
                errors?.password ? "border-red-500" : ""
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
            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
          )}
        </div>

        {/* FULL NAME */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Full Name</label>

          <input
            type="text"
            name="fullName"
            autoComplete="name"
            className={`w-full border p-2 rounded ${
              errors?.fullName ? "border-red-500" : ""
            }`}
            placeholder="Enter full name"
            value={form.fullName || ""}
            onChange={(e) => {
              setForm({ ...form, fullName: e.target.value });

              {
                errors?.fullName && (
                  <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
                );
              }
            }}
          />

          {errors?.fullName && (
            <p className="text-red-500 text-xs mt-1">{errors.fullName}</p>
          )}
        </div>

        {/* PHONE */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Phone</label>
          <input
            type="text"
            placeholder="Enter phone"
            className={`w-full border p-2 rounded ${
              errors?.phone ? "border-red-500" : ""
            }`}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />
          {errors?.phone && (
            <p className="text-red-500 text-xs mt-1">{errors.phone}</p>
          )}
        </div>

        {/* GENDER */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">GENDER</label>
          <select
            className="w-full border p-2 rounded"
            value={form.gender || "MALE"}
            onChange={(e) => setForm({ ...form, gender: e.target.value })}
          >
            <option value="LOCAL">MALE</option>
            <option value="GOOGLE">FEMALE</option>
            <option value="FACEBOOK">OTHER</option>
          </select>
        </div>

        {/* PROVIDER */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Provider</label>
          <select
            className="w-full border p-2 rounded"
            value={form.provider || "LOCAL"}
            onChange={(e) => setForm({ ...form, provider: e.target.value })}
          >
            <option value="LOCAL">LOCAL</option>
            <option value="GOOGLE">GOOGLE</option>
            <option value="FACEBOOK">FACEBOOK</option>
          </select>
        </div>

        {/* ROLE */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Role</label>
          <select
            className="w-full border p-2 rounded"
            value={form.role || "USER"}
            onChange={(e) => setForm({ ...form, role: e.target.value })}
          >
            <option value="OWNER">OWNER</option>
            <option value="ADMIN">ADMIN</option>
            <option value="TENANT">TENANT</option>
          </select>
        </div>

        {/* STATUS */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Status</label>
          <select
            className="w-full border p-2 rounded"
            value={form.status || "RENTING"}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
          >
            <option value="NO_RENTING">NO_RENTING</option>
            <option value="RENTING">RENTING</option>
          </select>
        </div>

        {/* ACTIVE */}
        <div className="mb-6">
          <label className="block mb-1 font-medium">Active</label>
          <select
            className="w-full border p-2 rounded"
            value={form.active || "YES"}
            onChange={(e) => setForm({ ...form, active: e.target.value })}
          >
            <option value="YES">YES</option>
            <option value="NO">NO</option>
          </select>
        </div>

        {/* BUTTONS */}
        <div className="flex gap-3">
          <button
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
