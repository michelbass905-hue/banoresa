import { db } from "./client.js";
import { roomTypes, rooms } from "./schema.js";

async function seed() {
  await db.insert(roomTypes).values([
    { typeId: "STD", label: "Standard", baseRate: "35000.00" },
    { typeId: "JSUITE", label: "Junior Suite", baseRate: "55000.00" },
    { typeId: "SSUITE", label: "Senior Suite", baseRate: "80000.00" },
  ]);
  await db.insert(rooms).values([
    { roomNumber: 101, typeId: "STD" },
    { roomNumber: 102, typeId: "STD" },
    { roomNumber: 103, typeId: "STD" },
    { roomNumber: 201, typeId: "JSUITE" },
    { roomNumber: 202, typeId: "JSUITE" },
    { roomNumber: 301, typeId: "SSUITE" },
  ]);
  console.log("Seed complete.");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });
