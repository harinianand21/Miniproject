import { toast } from 'sonner';

/**
 * Custom hook for displaying notifications throughout the app
 * Uses Sonner toast library for consistent, accessible notifications
 * 
 * @example
 * const notify = useNotification();
 * notify.success('Report submitted successfully!');
 * notify.error('Failed to connect to server');
 */
export const useNotification = () => {
    /**
     * Display a success notification
     * @param message - The message to display
     * @param duration - Optional duration in milliseconds (default: 4000)
     */
    const success = (message: string, duration?: number) => {
        toast.success(message, {
            duration: duration || 4000,
        });
    };

    /**
     * Display an error notification
     * @param message - The error message to display
     * @param duration - Optional duration in milliseconds (default: 5000)
     */
    const error = (message: string, duration?: number) => {
        toast.error(message, {
            duration: duration || 5000,
        });
    };

    /**
     * Display an info notification
     * @param message - The info message to display
     * @param duration - Optional duration in milliseconds (default: 3000)
     */
    const info = (message: string, duration?: number) => {
        toast.info(message, {
            duration: duration || 3000,
        });
    };

    /**
     * Display a warning notification
     * @param message - The warning message to display
     * @param duration - Optional duration in milliseconds (default: 4000)
     */
    const warning = (message: string, duration?: number) => {
        toast.warning(message, {
            duration: duration || 4000,
        });
    };

    /**
     * Display a loading notification
     * Returns a function to dismiss the loading toast
     * @param message - The loading message to display
     * @returns Function to dismiss the loading toast
     */
    const loading = (message: string) => {
        const id = toast.loading(message);
        return () => toast.dismiss(id);
    };

    /**
     * Display a promise-based notification
     * Automatically shows loading, success, or error based on promise state
     * @param promise - The promise to track
     * @param messages - Messages for loading, success, and error states
     */
    const promise = <T,>(
        promiseOrFunction: Promise<T> | (() => Promise<T>),
        messages: {
            loading: string;
            success: string | ((data: T) => string);
            error: string | ((error: any) => string);
        }
    ) => {
        return toast.promise(promiseOrFunction, messages);
    };

    return {
        success,
        error,
        info,
        warning,
        loading,
        promise,
    };
};
