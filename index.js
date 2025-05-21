const express = require("express");
const app = express();

app.use(express.json()); // parsing JSON body

function toBase64Url(buffer) {
  const binary = Array.from(buffer)
    .map((b) => String.fromCharCode(b))
    .join("");
  return Buffer.from(binary, "binary")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function fromBase64(base64) {
  // Base64-url to base64 (replace - _ back to + /)
  base64 = base64.replace(/-/g, "+").replace(/_/g, "/");
  // Add padding if missing
  while (base64.length % 4) base64 += "=";
  return Buffer.from(base64, "base64");
}

async function encrypt(plainText, base64Key) {
  const crypto = require("crypto");

  const keyBytes = fromBase64(base64Key);
  const iv = crypto.randomBytes(16);

  const cipher = crypto.createCipheriv("aes-128-gcm", keyBytes, iv);

  const encrypted = Buffer.concat([
    cipher.update(plainText, "utf8"),
    cipher.final(),
  ]);
  const tag = cipher.getAuthTag();

  // Gabungkan iv + ciphertext + tag
  const combined = Buffer.concat([iv, encrypted, tag]);

  // Base64 URL-safe encoding
  return combined
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

app.post("/encrypt", async (req, res) => {
  try {
    const { plainText, base64Key } = req.body;
    if (!plainText || !base64Key) {
      return res.status(400).json({ error: "plainText and base64Key required" });
    }

    const encrypted = await encrypt(plainText, base64Key);

    res.json({ encrypted });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Encryption failed" });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
