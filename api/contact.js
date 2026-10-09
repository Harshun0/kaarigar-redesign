const { MongoClient } = require("mongodb");

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "kaarigar";

let clientPromise;

function getClient() {
  if (!clientPromise) {
    const client = new MongoClient(uri);
    clientPromise = client.connect();
  }
  return clientPromise;
}

module.exports = async (req, res) => {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (!uri) {
    res.status(500).json({ error: "Server is missing MONGODB_URI" });
    return;
  }

  const { firstName, lastName, email, phone, projectType, message } = req.body || {};

  if (!firstName || !lastName || !email || !projectType || !message) {
    res.status(400).json({ error: "Please fill in all required fields." });
    return;
  }

  try {
    const client = await getClient();
    const db = client.db(dbName);
    await db.collection("contacts").insertOne({
      firstName,
      lastName,
      email,
      phone: phone || "",
      projectType,
      message,
      createdAt: new Date(),
    });
    res.status(200).json({ ok: true });
  } catch (err) {
    console.error("Failed to save contact submission", err);
    res.status(500).json({ error: "Something went wrong. Please try again later." });
  }
};
