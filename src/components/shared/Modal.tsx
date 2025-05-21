import React, { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import styles from "./Modal.module.css";
import Button from "./Button";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "small" | "medium" | "large" | "fullscreen";
  closeOnClickOutside?: boolean;
  closeOnEscape?: boolean;
}

const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  size = "medium",
  closeOnClickOutside = true,
  closeOnEscape = true,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleEscapeKey = (event: KeyboardEvent) => {
      if (closeOnEscape && event.key === "Escape") {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscapeKey);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose, closeOnEscape]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (closeOnClickOutside && e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Use portals to render the modal at the document body level
  return createPortal(
    <div className={styles.modalBackdrop} onClick={handleBackdropClick}>
      <div
        className={`${styles.modalContainer} ${styles[size]}`}
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
      >
        {title && (
          <div className={styles.modalHeader}>
            <h3 id="modal-title" className={styles.modalTitle}>
              {title}
            </h3>
            <button
              className={styles.closeButton}
              onClick={onClose}
              aria-label="Close modal"
            >
              &times;
            </button>
          </div>
        )}

        {!title && (
          <button
            className={`${styles.closeButton} ${styles.floatingClose}`}
            onClick={onClose}
            aria-label="Close modal"
          >
            &times;
          </button>
        )}

        <div className={styles.modalBody}>{children}</div>

        {footer && <div className={styles.modalFooter}>{footer}</div>}
      </div>
    </div>,
    document.body
  );
};

// Export a default modal footer layout for common use cases
export const ModalFooter: React.FC<{
  cancelText?: string;
  confirmText?: string;
  onCancel: () => void;
  onConfirm: () => void;
  confirmDisabled?: boolean;
  isConfirmLoading?: boolean;
  confirmVariant?: "primary" | "danger" | "success";
}> = ({
  cancelText = "Cancel",
  confirmText = "Confirm",
  onCancel,
  onConfirm,
  confirmDisabled = false,
  isConfirmLoading = false,
  confirmVariant = "primary",
}) => {
  return (
    <>
      <Button variant="secondary" onClick={onCancel}>
        {cancelText}
      </Button>
      <Button
        variant={confirmVariant}
        onClick={onConfirm}
        disabled={confirmDisabled}
        isLoading={isConfirmLoading}
      >
        {confirmText}
      </Button>
    </>
  );
};

export default Modal;
