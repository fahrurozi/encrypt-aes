const crypto = require("crypto");

function fromBase64(base64) {
  base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64");
}

function toBase64Url(buffer) {
  return buffer
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { plainText, base64Key } = JSON.parse(event.body);
    if (!plainText || !base64Key) {
      return { statusCode: 400, body: "plainText and base64Key required" };
    }

    const keyBytes = fromBase64(base64Key);
    const iv = crypto.randomBytes(16);

    const cipher = crypto.createCipheriv("aes-128-gcm", keyBytes, iv);
    const encrypted = Buffer.concat([
      cipher.update(plainText, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    const combined = Buffer.concat([iv, encrypted, tag]);

    const encryptedBase64Url = toBase64Url(combined);

    return {
      statusCode: 200,
      body: JSON.stringify({ encrypted: encryptedBase64Url }),
    };
  } catch (err) {
    return { statusCode: 500, body: "Encryption failed" };
  }
};
