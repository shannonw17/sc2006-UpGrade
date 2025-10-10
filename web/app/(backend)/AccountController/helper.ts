export function validatePassword(password: string): { success: boolean; message?: string } {
    if (typeof password !== "string") return { success: false, message: "Password must be a string" };
    if (password.length < 12) return { success: false, message: "Password must be at least 12 characters" };
    if (!/[A-Z]/.test(password)) return { success: false, message: "Must contain an uppercase letter" };
    if (!/[a-z]/.test(password)) return { success: false, message: "Must contain a lowercase letter" };
    if (!/[0-9]/.test(password)) return { success: false, message: "Must contain a digit" };
    if (!/[^A-Za-z0-9]/.test(password)) return { success: false, message: "Must contain a special character" };
    return { success: true };
}