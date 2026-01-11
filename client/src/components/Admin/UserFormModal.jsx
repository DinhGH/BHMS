import { FaHome } from "react-icons/fa";

export default function UserFormModal({
  open,
  onClose,
  onSubmit,
  form,
  setForm,
}) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center">
      <div className="bg-white w-2xl  h-full p-6 overflow-y-auto relative">
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
            className="w-full border p-2 rounded"
            placeholder="Enter email"
            value={form.email || ""}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        {/* PASSWORD */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Password</label>
          <input
            type="password"
            className="w-full border p-2 rounded"
            placeholder="Enter password (optional)"
            value={form.password || ""}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        {/* FULL NAME */}
        <div className="mb-4">
          <label className="block mb-1 font-medium">Full Name</label>
          <input
            type="text"
            className="w-full border p-2 rounded"
            placeholder="Enter full name"
            value={form.fullName || ""}
            onChange={(e) => setForm({ ...form, fullName: e.target.value })}
          />
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
