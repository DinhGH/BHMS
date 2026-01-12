const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_APP_PASSWORD,
  },
});

async function sendOTP(email, otp) {
  const mailOptions = {
    from: `"BHMS System" <${process.env.GMAIL_USER}>`,
    to: email,
    subject: "Reset Password OTP",
    html: `
      <h3>OTP xác thực đổi mật khẩu</h3>
      <p>Mã OTP của bạn là: <b>${otp}</b></p>
      <p>Mã có hiệu lực trong 5 phút.</p>
    `,
  };

  await transporter.sendMail(mailOptions);
}

module.exports = { sendOTP };
