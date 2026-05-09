import Toast from 'react-native-toast-message';

type FeedbackType = 'success' | 'error' | 'info';

export function showFeedback(type: FeedbackType, title: string, message?: string) {
  Toast.show({
    type,
    text1: title,
    text2: message,
    visibilityTime: type === 'error' ? 4200 : 2600,
    position: 'top',
    topOffset: 54,
  });
}

export const showSuccess = (title: string, message?: string) => showFeedback('success', title, message);
export const showError = (title: string, message?: string) => showFeedback('error', title, message);
export const showInfo = (title: string, message?: string) => showFeedback('info', title, message);
