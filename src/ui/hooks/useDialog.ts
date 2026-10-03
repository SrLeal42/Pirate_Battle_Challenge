import { useEffect, useRef } from 'react';

export function useDialog(isOpen: boolean, onClose?: () => void) {
    const dialogRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (!isOpen) return;

        const currentDialog = dialogRef.current;
        if (!currentDialog) return;

        currentDialog.focus();

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape' && onClose) {
                e.preventDefault();
                e.stopPropagation();
                onClose();
                return;
            }

            if (e.key === 'Tab') {
                const focusableElements = currentDialog.querySelectorAll<HTMLElement>(
                    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
                );
                const firstElement = focusableElements[0];
                const lastElement = focusableElements[focusableElements.length - 1];

                if (!firstElement || !lastElement) return;

                if (e.shiftKey) {
                    if (document.activeElement === firstElement || document.activeElement === currentDialog) {
                        e.preventDefault();
                        lastElement.focus();
                    }
                } else {
                    if (document.activeElement === lastElement) {
                        e.preventDefault();
                        firstElement.focus();
                    }
                }
            }
        };

        // O 'true' no final usa a fase de captura, interceptando o input antes de chegar ao jogo
        document.addEventListener('keydown', handleKeyDown, true);

        return () => {
            document.removeEventListener('keydown', handleKeyDown, true);
        };
    }, [isOpen, onClose]);

    return dialogRef;
}
