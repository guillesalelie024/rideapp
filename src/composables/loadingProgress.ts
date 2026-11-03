import { ref } from 'vue';

export const pendingLoadingOperations = ref(0);

export function beginLoadingOperation(): () => void {
  pendingLoadingOperations.value += 1;
  let completed = false;

  return () => {
    if (completed) return;
    completed = true;
    pendingLoadingOperations.value = Math.max(0, pendingLoadingOperations.value - 1);
  };
}
