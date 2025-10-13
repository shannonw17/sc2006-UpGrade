import nodemailer from "nodemailer";

// reusable transporter 
export const transporter = nodemailer.createTransport({
    service: "gmail", // can be 'outlook' also
    auth: {
        user: process.env.EMAIL_USER, //my email address
        pass: process.env.EMAIL_PASS, //my app pwd for gmail acc (16 digit code)
        // stored in .env
    },
});

export async function sendEmail(to: string, subject: string, text: string) {
    try{
        await transporter.sendMail({
            from: `"UpGrade Website Admin" <${process.env.EMAIL_USER}>`,
            to,
            subject,
            text,
        });
        console.log(`Email sent to ${to}`);
    } catch (error) {
        console.error("Error sending email: ", error);
        throw new Error("Failed to send email");     //added
    }
}