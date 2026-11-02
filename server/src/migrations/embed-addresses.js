// Chuyển collection `addresses` cũ vào users.addresses và bổ sung trạng thái duyệt cho shop cũ.
// Chạy 1 lần: node src/migrations/embed-addresses.js
import mongoose from "mongoose";
import { connectDb } from "../db.js";

await connectDb();
const db = mongoose.connection.db;

const hasAddresses = (await db.listCollections({ name: "addresses" }).toArray()).length > 0;
if (hasAddresses) {
  const old = await db.collection("addresses").find().toArray();
  let moved = 0;
  for (const a of old) {
    const { _id, user, recipientName, phone, street, city, isDefault } = a;
    const res = await db.collection("users").updateOne(
      { _id: user, "addresses._id": { $ne: _id } },
      { $push: { addresses: { _id, recipientName, phone, street, city, isDefault: Boolean(isDefault) } } }
    );
    moved += res.modifiedCount;
  }
  const embedded = (await db.collection("users").aggregate([{ $unwind: "$addresses" }, { $count: "n" }]).toArray())[0]?.n || 0;
  console.log(`Địa chỉ: ${old.length} trong collection cũ, chuyển mới ${moved}, hiện có ${embedded} địa chỉ nhúng trong users`);
  if (embedded >= old.length) {
    await db.collection("addresses").drop();
    console.log("Đã xóa collection addresses cũ");
  } else {
    console.log("Số địa chỉ không khớp, giữ lại collection addresses để kiểm tra");
  }
}

const shops = await db.collection("shops").updateMany(
  { status: { $exists: false } },
  { $set: { status: "Approved", rejectReason: "", reviewedAt: new Date() } }
);
await db.collection("shops").updateMany({ addresses: { $exists: false } }, { $set: { addresses: [] } });
console.log(`Shop cũ được đánh dấu Approved: ${shops.modifiedCount}`);

await mongoose.disconnect();
