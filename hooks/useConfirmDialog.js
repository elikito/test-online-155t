import { useState } from 'react';

export function useConfirmDialog() {
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [confirmAction, setConfirmAction] = useState(null);
  const [confirmMessage, setConfirmMessage] = useState('');

  const showCustomConfirm = (message, action) => {
    setConfirmMessage(message);
    setConfirmAction(() => action);
    setShowConfirmDialog(true);
  };

  const handleConfirm = (confirmed) => {
    setShowConfirmDialog(false);
    if (confirmed && confirmAction) {
      confirmAction();
    }
    setConfirmAction(null);
    setConfirmMessage('');
  };

  return {
    showConfirmDialog,
    confirmMessage,
    showCustomConfirm,
    handleConfirm
  };
}