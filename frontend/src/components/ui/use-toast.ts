// Inspired by react-hot-toast library
import { toast as sonnerToast, type ToastT } from "sonner";

export const useToast = () => {
  return {
    toast: sonnerToast,
  };
};

export type { ToastT }; 