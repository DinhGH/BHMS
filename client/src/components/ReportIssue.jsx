import { useEffect, useState } from "react";
import { createReportAdmin } from "../services/api";
import { useAuth } from "../contexts/AuthContext";

const TARGET_OPTIONS = [
  "Account / Sign in",
  "Room management",
  "Payments / Invoices",
  "Notifications",
  "Reports / Analytics",
  "Other",
];

const MAX_IMAGE_SIZE_MB = 2;
const MAX_IMAGE_SIZE_BYTES = MAX_IMAGE_SIZE_MB * 1024 * 1024;

function ReportIssue() {
  const { user, loading: authLoading } = useAuth();
  const [target, setTarget] = useState("");
  const [content, setContent] = useState("");
  const [images, setImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState({ type: "idle", message: "" });
  const [popup, setPopup] = useState({
    open: false,
    type: "success",
    message: "",
  });

  const isValid = target.trim() && content.trim().length >= 20 && user?.id;

  const resetForm = () => {
    setTarget("");
    setContent("");
    setImages([]);
  };

  const handleImageChange = async (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (!imageFiles.length) {
      setPopup({
        open: true,
        type: "error",
        message: "Please select image files only.",
      });
      return;
    }

    const oversizedFiles = imageFiles.filter(
      (file) => file.size > MAX_IMAGE_SIZE_BYTES,
    );
    if (oversizedFiles.length) {
      setPopup({
        open: true,
        type: "error",
        message: `Image too large. Max ${MAX_IMAGE_SIZE_MB}MB per image.`,
      });
    }

    const validImages = imageFiles.filter(
      (file) => file.size <= MAX_IMAGE_SIZE_BYTES,
    );
    if (!validImages.length) {
      event.target.value = "";
      return;
    }

    const readFile = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () =>
          resolve({ name: file.name, dataUrl: reader.result });
        reader.readAsDataURL(file);
      });

    const newImages = await Promise.all(validImages.map(readFile));
    setImages((prev) => [...prev, ...newImages]);
    event.target.value = "";
  };

  const removeImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!isValid || isSubmitting) return;

    setIsSubmitting(true);
    setStatus({ type: "idle", message: "" });

    try {
      const payload = {
        senderId: user.id,
        senderEmail: user?.email,
        target: target.trim(),
        content: content.trim(),
        images: images.length ? images.map((item) => item.dataUrl) : null,
      };

      await createReportAdmin(payload);
      setStatus({
        type: "success",
        message: "Report submitted successfully. Admin will respond soon.",
      });
      setPopup({
        open: true,
        type: "success",
        message: "Report submitted successfully.",
      });
      resetForm();
    } catch {
      setStatus({
        type: "error",
        message:
          "Failed to submit report. Please check your inputs and try again.",
      });
      setPopup({
        open: true,
        type: "error",
        message:
          "Failed to submit report. Please check your inputs and try again.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    if (!popup.open) return undefined;
    const timer = setTimeout(() => {
      setPopup((prev) => ({ ...prev, open: false }));
    }, 3000);
    return () => clearTimeout(timer);
  }, [popup.open]);

  return (
    <div className="h-full w-full bg-slate-50 px-3 py-4 sm:px-5 sm:py-5">
      {popup.open && (
        <div className="fixed right-4 top-4 z-50 sm:right-6 sm:top-6">
          <div
            className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold shadow-lg transition ${
              popup.type === "success"
                ? "bg-emerald-600 text-white"
                : "bg-rose-600 text-white"
            }`}
          >
            <span>{popup.message}</span>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-none">
        <div className="mb-6 flex flex-col gap-2 sm:mb-8 sm:gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">
            Issue Report
          </p>
          <h1 className="text-2xl font-semibold text-slate-900 sm:text-4xl">
            Report Issue
          </h1>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            Report system incidents or improvement requests. The information
            will be sent directly to admin for handling.
          </p>
        </div>

        <div className="grid gap-6">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6"
          >
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              <div>
                <label className="text-xs font-semibold text-slate-700 sm:text-sm">
                  Issue category
                </label>
                <div className="mt-2">
                  <select
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                  >
                    <option value="">Select a category</option>
                    {TARGET_OPTIONS.map((item) => (
                      <option key={item} value={item}>
                        {item}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 sm:text-sm">
                  Sender
                </label>
                <div className="mt-2 flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                  <span className="font-semibold text-slate-800">
                    {authLoading ? "Loading..." : user?.name || "Not signed in"}
                  </span>
                  <span>{user?.email || ""}</span>
                </div>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold text-slate-700 sm:text-sm">
                Detailed description
              </label>
              <div className="mt-2">
                <textarea
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  rows={8}
                  placeholder="Example: Unable to update room status, system returns 500 when saving..."
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-4 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200"
                />
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-500">
                <span>Minimum 20 characters.</span>
                <span>{content.trim().length} / 500</span>
              </div>
            </div>

            <div className="mt-5">
              <label className="text-xs font-semibold text-slate-700 sm:text-sm">
                Upload images
              </label>
              <div className="mt-2 flex flex-col gap-3">
                <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-slate-50 px-4 py-5 text-sm font-semibold text-slate-600 transition hover:border-indigo-400 hover:bg-white sm:py-6">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageChange}
                  />
                  Choose images
                </label>
                {images.length > 0 && (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3">
                    {images.map((image, index) => (
                      <div
                        key={`${image.name}-${index}`}
                        className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
                      >
                        <img
                          src={image.dataUrl}
                          alt={image.name}
                          className="h-32 w-full object-cover transition duration-300 group-hover:scale-105"
                        />
                        <button
                          type="button"
                          onClick={() => removeImage(index)}
                          className="absolute right-2 top-2 rounded-full bg-slate-900/80 px-2 py-1 text-xs font-semibold text-white opacity-0 transition group-hover:opacity-100"
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {status.type !== "idle" && (
              <div
                className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${
                  status.type === "success"
                    ? "bg-emerald-50 text-emerald-700"
                    : "bg-rose-50 text-rose-700"
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="mt-6 flex justify-center">
              <button
                type="submit"
                disabled={!isValid || isSubmitting}
                className="w-full rounded-full bg-slate-900 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-slate-900/20 transition hover:-translate-y-0.5 hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none sm:w-auto sm:px-10"
              >
                {isSubmitting ? "Sending..." : "Send Report"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;
