const crypto = require("crypto");

const sessions = new Map();
const SESSION_COOKIE = "cqb_session";

function parseCookies(header = "") {
  return header.split(";").reduce((accumulator, item) => {
    const [key, ...rest] = item.trim().split("=");
    if (!key) return accumulator;
    accumulator[key] = decodeURIComponent(rest.join("="));
    return accumulator;
  }, {});
}

function hashPassword(password, salt = crypto.randomBytes(16).toString("hex")) {
  const hash = crypto.scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${hash}`;
}

function verifyPassword(password, storedValue) {
  const [salt, originalHash] = String(storedValue || "").split(":");
  if (!salt || !originalHash) return false;
  const derivedHash = crypto.scryptSync(password, salt, 64).toString("hex");
  return crypto.timingSafeEqual(Buffer.from(originalHash, "hex"), Buffer.from(derivedHash, "hex"));
}

function createSession(userId) {
  const token = crypto.randomBytes(24).toString("hex");
  sessions.set(token, {
    userId,
    createdAt: Date.now()
  });
  return token;
}

function getSession(token) {
  if (!token) return null;
  return sessions.get(token) || null;
}

function destroySession(token) {
  if (!token) return;
  sessions.delete(token);
}

function sessionCookie(token) {
  return `${SESSION_COOKIE}=${encodeURIComponent(token)}; HttpOnly; Path=/; SameSite=Lax`;
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax`;
}

module.exports = {
  SESSION_COOKIE,
  createSession,
  destroySession,
  expiredSessionCookie,
  getSession,
  hashPassword,
  parseCookies,
  sessionCookie,
  verifyPassword
};
