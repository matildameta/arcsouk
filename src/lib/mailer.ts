import nodemailer from 'nodemailer';

export async function sendOtpEmail(email: string, code: string) {
  const host = process.env.EMAIL_SERVER_HOST;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;
  const from = process.env.EMAIL_FROM || 'Arc Souk <no-reply@arcsouk.app>';

  // Dev fallback: if SMTP isn't configured, print the code to the server console
  // so you can test the flow without an email provider.
  if (!host || !user || !pass) {
    // eslint-disable-next-line no-console
    console.log(`\n  ┌─ Arc Souk login code ──────────────\n  │  ${email}\n  │  CODE: ${code}  (expires in 10 min)\n  └────────────────────────────────────\n`);
    return;
  }

  const port = Number(process.env.EMAIL_SERVER_PORT || 587);
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  await transport.sendMail({
    from,
    to: email,
    subject: 'Your Arc Souk login code',
    text: `Your Arc Souk login code is ${code}. It expires in 10 minutes.`,
    html: `
      <div style="font-family:system-ui,sans-serif;max-width:440px;margin:0 auto;padding:32px;background:#070A12;border-radius:20px;color:#F4F7FF">
        <div style="font-size:13px;letter-spacing:.18em;text-transform:uppercase;color:#22D3EE">Arc Souk</div>
        <h1 style="font-size:22px;margin:14px 0 6px">Your login code</h1>
        <p style="color:#A7B2C8;margin:0 0 22px">Enter this code to sign in. It expires in 10 minutes.</p>
        <div style="font-size:34px;font-weight:700;letter-spacing:.3em;background:linear-gradient(100deg,#2D7CFF,#A06BFF,#FF6AD5);-webkit-background-clip:text;background-clip:text;color:transparent">${code}</div>
        <p style="color:#5E6880;font-size:12px;margin-top:26px">If you didn't request this, you can ignore this email.</p>
      </div>`,
  });
}
