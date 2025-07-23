// Shared OTP store for verification
// In production, this should be Redis or a database
const otpStore = new Map();

// Clean up expired OTPs every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, data] of otpStore.entries()) {
    if (now - data.timestamp > 100000) { // 100 seconds
      otpStore.delete(key);
    }
  }
}, 300000);

export { otpStore };