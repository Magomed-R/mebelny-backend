import dotenv from "dotenv"
dotenv.config()

import nodemailer from "nodemailer"

const transporter = nodemailer.createTransport({
    service: "mail.ru",
    auth: {
        user: process.env.MAIL,
        pass: process.env.MAIL_PASS,
    },
});

const mailer = (to, subject, text) => {
    transporter.sendMail(
        {
            from: process.env.MAIL,
            to: to,
            subject: subject,
            html: text
        },
        (err, info) => {
            if (err) return console.log(err);

            console.log("Email sent: ", info);
        }
    );
};

export default mailer;