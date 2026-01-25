import { FaRegEye } from "react-icons/fa";
import { LuEyeClosed } from "react-icons/lu";

export default function Eye({ show, onToggle }) {
  return (
    <button
      type="button"
      onClick={onToggle}
      className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
      aria-label={show ? "Hide password" : "Show password"}
    >
      {show ? <FaRegEye size={18} /> : <LuEyeClosed size={18} />}
    </button>
  );
}
