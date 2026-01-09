import { FaUserCircle, FaBell } from "react-icons/fa";

function Navbar() {
  const user = {
    name: "Nguyễn Văn A",
    avatar: null,
  };

  return (
    <header className="bg-white border-b border-gray-300 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-bold text-black">
          Boarding House Management System
        </h1>

        <div className="flex items-center gap-6">
          <button className="relative text-gray-600 hover:text-black transition-colors">
            <FaBell className="text-xl" />
            <span className="absolute -top-1 -right-1 bg-red-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
              3
            </span>
          </button>

          <div className="flex items-center gap-3">
            <button
              className="flex items-center gap-2 focus:outline-none"
              onClick={() => alert("Profile clicked")}
            >
              {user.avatar ? (
                <img
                  src={user.avatar}
                  alt={user.name}
                  className="w-10 h-10 rounded-full border-2 border-gray-400"
                />
              ) : (
                <FaUserCircle className="text-4xl text-gray-600" />
              )}
            </button>
            <div className="text-right">
              <p className="text-sm font-semibold text-black">{user.name}</p>
              <p className="text-xs text-gray-600">Owner</p>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

export default Navbar;
