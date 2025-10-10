//check if email ends with ".edu.sg"

//to change to check against a database of school emails to see if email exists

"use server";

export function validateEmail(email: string): boolean {
    if (!email || typeof email !== 'string') return false;
    return email.toLowerCase().trim().endsWith('.edu,sg');
}