import { useCallback, useRef, useState } from "react";
import ConfirmDialog from "../components/common/ConfirmDialog";

const defaultOptions = {
  title: "Confirm action",
  message: "Are you sure you want to continue?",
  confirmText: "Confirm",
  cancelText: "Cancel",
  variant: "danger",
};

export default function useConfirmDialog() {
  const resolverRef = useRef(null);
  const [config, setConfig] = useState(defaultOptions);
  const [open, setOpen] = useState(false);

  const closeWith = useCallback((result) => {
    if (resolverRef.current) {
      resolverRef.current(result);
      resolverRef.current = null;
    }
    setOpen(false);
  }, []);

  const confirm = useCallback((options = {}) => {
    setConfig({ ...defaultOptions, ...options });
    setOpen(true);
    return new Promise((resolve) => {
      resolverRef.current = resolve;
    });
  }, []);

  const confirmDialog = (
    <ConfirmDialog
      open={open}
      title={config.title}
      message={config.message}
      confirmText={config.confirmText}
      cancelText={config.cancelText}
      variant={config.variant}
      onCancel={() => closeWith(false)}
      onConfirm={() => closeWith(true)}
    />
  );

  return { confirm, confirmDialog };
}
