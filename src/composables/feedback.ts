export type FeedbackTone = 'success' | 'error' | 'info';

export function showFeedback(message: string, tone: FeedbackTone = 'info', title?: string, onClose?: () => void) {
  window.dispatchEvent(new CustomEvent('ride:feedback', {
    detail: { message, tone, title, onClose },
  }));
}

export const showSuccess = (message: string, title = 'Success', onClose?: () => void) => showFeedback(message, 'success', title, onClose);
export const showError = (message: string, title = 'Something went wrong') => showFeedback(message, 'error', title);
export const showInfo = (message: string, title = 'Notice') => showFeedback(message, 'info', title);
