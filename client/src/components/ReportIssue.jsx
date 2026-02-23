import { useEffect, useState } from "react";
import Loading from "./loading.jsx";
import {
  createReportAdmin,
  getReportAdmins,
  updateReportAdmin,
  deleteReportAdmin,
} from "../services/api";
import { useAuth } from "../hooks/useAuth";

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

  const [myReports, setMyReports] = useState([]);
  const [myReportsLoading, setMyReportsLoading] = useState(false);
  const [myReportsError, setMyReportsError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editTarget, setEditTarget] = useState("");
  const [editContent, setEditContent] = useState("");
  const [editImages, setEditImages] = useState([]);
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [recallModal, setRecallModal] = useState({
    open: false,
    reportId: null,
  });
  const [recallSubmitting, setRecallSubmitting] = useState(false);
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

  const formatDate = (value) => {
    if (!value) return "";
    const date = value instanceof Date ? value : new Date(value);
    return new Intl.DateTimeFormat("vi-VN", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(date);
  };

  const loadMyReports = async (currentUserId) => {
    if (!currentUserId) return;
    setMyReportsLoading(true);
    setMyReportsError("");
    try {
      const result = await getReportAdmins({
        senderId: currentUserId,
        limit: 5,
        orderBy: "createdAt",
        order: "desc",
      });
      setMyReports(Array.isArray(result?.data) ? result.data : []);
    } catch (error) {
      setMyReportsError(error?.message || "Failed to load your reports");
    } finally {
      setMyReportsLoading(false);
    }
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

  const handleEditImageChange = async (event) => {
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
        reader.onload = () => resolve(reader.result);
        reader.readAsDataURL(file);
      });

    const newImages = await Promise.all(validImages.map(readFile));
    setEditImages((prev) => [...prev, ...newImages]);
    event.target.value = "";
  };

  const removeEditImage = (indexToRemove) => {
    setEditImages((prev) => prev.filter((_, index) => index !== indexToRemove));
  };

  const startEdit = (report) => {
    setEditingId(report.id);
    setEditTarget(report.target || "");
    setEditContent(report.content || "");
    setEditImages(Array.isArray(report.images) ? report.images : []);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditTarget("");
    setEditContent("");
    setEditImages([]);
    setEditSubmitting(false);
  };

  const handleSaveEdit = async (reportId) => {
    if (editSubmitting) return;
    if (!editTarget.trim() || editContent.trim().length < 20) {
      setPopup({
        open: true,
        type: "error",
        message: "Please complete all required fields (min 20 characters).",
      });
      return;
    }

    setEditSubmitting(true);
    try {
      await updateReportAdmin(reportId, {
        senderId: user?.id,
        target: editTarget.trim(),
        content: editContent.trim(),
        images: editImages.length ? editImages : null,
      });
      setPopup({
        open: true,
        type: "success",
        message: "Report updated successfully.",
      });
      await loadMyReports(user?.id);
      cancelEdit();
    } catch (error) {
      setPopup({
        open: true,
        type: "error",
        message: error?.message || "Failed to update report.",
      });
      setEditSubmitting(false);
    }
  };

  const handleRecall = (reportId) => {
    setRecallModal({ open: true, reportId });
  };

  const closeRecallModal = () => {
    if (recallSubmitting) return;
    setRecallModal({ open: false, reportId: null });
  };

  const confirmRecall = async () => {
    if (!recallModal.reportId || recallSubmitting) return;
    setRecallSubmitting(true);
    try {
      await deleteReportAdmin(recallModal.reportId, { senderId: user?.id });
      setPopup({
        open: true,
        type: "success",
        message: "Report has been withdrawn successfully.",
      });
      await loadMyReports(user?.id);
      setRecallModal({ open: false, reportId: null });
    } catch (error) {
      setPopup({
        open: true,
        type: "error",
        message: error?.message || "Failed to withdraw report.",
      });
    } finally {
      setRecallSubmitting(false);
    }
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
      await loadMyReports(user?.id);
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

  useEffect(() => {
    if (authLoading) return;
    if (!user?.id) return;
    loadMyReports(user.id);
  }, [authLoading, user?.id]);

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
      {recallModal.open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-5 shadow-[0_40px_90px_-50px_rgba(15,23,42,0.7)] sm:p-6">
            <div className="flex items-start gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-rose-50 text-rose-600">
                <span className="text-lg">!</span>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-slate-900">
                  Withdraw this report?
                </h3>
                <p className="mt-1 text-sm text-slate-600">
                  This action will permanently remove the report and its
                  attachments. You cannot undo this.
                </p>
              </div>
            </div>

            <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={closeRecallModal}
                disabled={recallSubmitting}
                className="rounded-full border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-600 transition hover:border-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={confirmRecall}
                disabled={recallSubmitting}
                className="rounded-full bg-rose-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-rose-200/60 transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:bg-rose-300"
              >
                {recallSubmitting ? "Withdrawing..." : "Withdraw report"}
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="mx-auto w-full max-w-none">
        <div className="grid gap-6 lg:grid-cols-[1.05fr_1fr] lg:items-start">
          <form
            onSubmit={handleSubmit}
            className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6"
          >
            <div className="grid gap-4 sm:gap-5 md:grid-cols-2">
              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700 sm:text-sm">
                  Issue category
                </label>
                <div className="rounded-2xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                  <div className="flex items-center justify-between gap-2 text-[11px] font-medium text-slate-500 sm:text-xs">
                    <span>Select the area you want to report</span>
                    {target && (
                      <span className="rounded-full bg-slate-100 px-3 py-1 text-[11px] font-semibold text-slate-700">
                        {target}
                      </span>
                    )}
                  </div>
                  <select
                    value={target}
                    onChange={(event) => setTarget(event.target.value)}
                    className="mt-2 w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-800 shadow-[0_10px_30px_-18px_rgba(15,23,42,0.35)] transition focus:border-indigo-400 focus:bg-white focus:ring-2 focus:ring-indigo-200 focus:ring-offset-1"
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

              <div className="flex flex-col gap-2">
                <label className="text-xs font-semibold text-slate-700 sm:text-sm">
                  Sender
                </label>
                <div className="flex flex-col gap-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
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

          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-[0_25px_60px_-40px_rgba(15,23,42,0.45)] sm:p-6">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">
                  History
                </p>
                <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">
                  Your submitted reports
                </h2>
              </div>
              {myReportsLoading && <Loading isLoading={myReportsLoading} />}
            </div>

            {myReportsError && (
              <div className="mt-4 rounded-2xl bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700">
                {myReportsError}
              </div>
            )}

            {!myReportsLoading && !myReportsError && myReports.length === 0 && (
              <div className="mt-4 rounded-2xl border border-dashed border-slate-200 px-4 py-6 text-center text-sm text-slate-500">
                You have not submitted any reports yet.
              </div>
            )}

            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
              {myReports.map((report) => (
                <div
                  key={report.id}
                  className="rounded-2xl border border-slate-100 bg-slate-50 px-4 py-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {editingId === report.id
                          ? editTarget || report.target
                          : report.target}
                      </p>
                      <p className="text-xs text-slate-500">
                        {formatDate(report.createdAt)}
                      </p>
                    </div>
                    <span className="rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-600">
                      {report.status}
                    </span>
                  </div>

                  {editingId === report.id ? (
                    <div className="mt-4 grid gap-4">
                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Issue category
                        </label>
                        <div className="mt-2">
                          <select
                            value={editTarget}
                            onChange={(event) =>
                              setEditTarget(event.target.value)
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
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
                        <label className="text-xs font-semibold text-slate-700">
                          Detailed description
                        </label>
                        <div className="mt-2">
                          <textarea
                            value={editContent}
                            onChange={(event) =>
                              setEditContent(event.target.value)
                            }
                            rows={5}
                            className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-200"
                          />
                        </div>
                        <div className="mt-1 text-xs text-slate-500">
                          {editContent.trim().length} / 500
                        </div>
                      </div>

                      <div>
                        <label className="text-xs font-semibold text-slate-700">
                          Images
                        </label>
                        <div className="mt-2 flex flex-col gap-3">
                          <label className="flex cursor-pointer items-center justify-center gap-3 rounded-2xl border border-dashed border-slate-300 bg-white px-4 py-4 text-xs font-semibold text-slate-600 transition hover:border-indigo-400">
                            <input
                              type="file"
                              accept="image/*"
                              multiple
                              className="hidden"
                              onChange={handleEditImageChange}
                            />
                            Add images
                          </label>
                          {editImages.length > 0 && (
                            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                              {editImages.map((imageUrl, index) => (
                                <div
                                  key={`edit-${report.id}-${index}`}
                                  className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
                                >
                                  <img
                                    src={imageUrl}
                                    alt={`Report ${report.id} edit attachment ${index + 1}`}
                                    className="h-24 w-full object-cover transition duration-300 group-hover:scale-105"
                                  />
                                  <button
                                    type="button"
                                    onClick={() => removeEditImage(index)}
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

                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={cancelEdit}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-slate-300"
                        >
                          Cancel
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(report.id)}
                          disabled={editSubmitting}
                          className="rounded-full bg-slate-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                        >
                          {editSubmitting ? "Saving..." : "Save"}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <p className="mt-3 text-sm text-slate-600">
                        {report.content}
                      </p>
                      {Array.isArray(report.images) &&
                        report.images.length > 0 && (
                          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                            {report.images.map((imageUrl, index) => (
                              <div
                                key={`${report.id}-image-${index}`}
                                className="group relative overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
                              >
                                <img
                                  src={imageUrl}
                                  alt={`Report ${report.id} attachment ${index + 1}`}
                                  className="h-28 w-full object-cover transition duration-300 group-hover:scale-105"
                                />
                              </div>
                            ))}
                          </div>
                        )}
                      <div className="mt-4 flex flex-wrap items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => startEdit(report)}
                          className="rounded-full border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRecall(report.id)}
                          className="rounded-full border border-rose-200 bg-rose-50 px-4 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-300 hover:bg-rose-100"
                        >
                          Withdraw
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ReportIssue;
