import { google } from 'googleapis';
import { encode } from 'js-base64';

export const sendOtpEmail = async (toEmail, otpCode) => {
  try {
    const oAuth2Client = new google.auth.OAuth2(
      process.env.GMAIL_CLIENT_ID,
      process.env.GMAIL_CLIENT_SECRET,
      "https://developers.google.com/oauthplayground"
    );
    
    oAuth2Client.setCredentials({ refresh_token: process.env.GMAIL_REFRESH_TOKEN });
    const gmail = google.gmail({ version: 'v1', auth: oAuth2Client });

    // Construct raw MIME email
    const subject = "Your Health Connect Password Reset Code";
    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
      `From: Health Connect <${process.env.GMAIL_SENDER_EMAIL}>`,
      `To: ${toEmail}`,
      'Content-Type: text/html; charset=utf-8',
      'MIME-Version: 1.0',
      `Subject: ${utf8Subject}`,
      '',
      `<h3>Password Reset Request</h3>
       <p>Your 6-digit OTP code is: <strong><span style="font-size: 24px;">${otpCode}</span></strong></p>
       <p>This code will expire in 5 minutes.</p>`
    ];
    const message = messageParts.join('\n');

    // Base64url encode the message to comply with Gmail API requirements
    const encodedMessage = encode(message).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

    await gmail.users.messages.send({
      userId: 'me',
      requestBody: { raw: encodedMessage },
    });

    console.log(`OTP sent to ${toEmail} via Gmail API.`);
  } catch (error) {
    console.error('Error sending email via Gmail API:', error);
    throw new Error('Failed to send email');
  }
};