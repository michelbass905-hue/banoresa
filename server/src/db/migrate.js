import { pool } from "./client.js";

export async function ensureSchema() {
  await pool.query(`CREATE TABLE IF NOT EXISTS clients (id INT AUTO_INCREMENT PRIMARY KEY, name VARCHAR(100) NOT NULL, email VARCHAR(100), phone VARCHAR(20) NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS room_types (type_id VARCHAR(10) PRIMARY KEY, label VARCHAR(50) NOT NULL, base_rate DECIMAL(10,2) NOT NULL)`);
  await pool.query(`CREATE TABLE IF NOT EXISTS rooms (room_number INT PRIMARY KEY, type_id VARCHAR(10) NOT NULL, status ENUM('available','locked','confirmed','maintenance') NOT NULL DEFAULT 'available', FOREIGN KEY (type_id) REFERENCES room_types(type_id))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS reservations (res_id VARCHAR(20) PRIMARY KEY, client_id INT NOT NULL, room_number INT NOT NULL, check_in DATETIME NOT NULL, check_out DATETIME NOT NULL, status ENUM('pending','locked','confirmed','checked_in','checked_out','no_show','cancelled','expired') NOT NULL DEFAULT 'pending', deposit_amount DECIMAL(10,2) DEFAULT 0.00, lock_expiry DATETIME, FOREIGN KEY (client_id) REFERENCES clients(id), FOREIGN KEY (room_number) REFERENCES rooms(room_number))`);
  await pool.query(`CREATE TABLE IF NOT EXISTS audit_log (log_id INT AUTO_INCREMENT PRIMARY KEY, res_id VARCHAR(20) NOT NULL, action VARCHAR(50) NOT NULL, old_data TEXT, new_data TEXT, agent_id VARCHAR(50) NOT NULL, timestamp DATETIME NOT NULL, FOREIGN KEY (res_id) REFERENCES reservations(res_id))`);
  await addColumnIfMissing("reservations", "channel", "VARCHAR(20) NOT NULL DEFAULT 'call'");
}

async function addColumnIfMissing(table, column, definition) {
  const [rows] = await pool.query(
    "SELECT COUNT(*) AS c FROM information_schema.COLUMNS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND COLUMN_NAME = ?",
    [table, column]
  );
  if (rows[0].c === 0) await pool.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
}

export async function seedIfEmpty() {
  const [rows] = await pool.query("SELECT COUNT(*) as count FROM rooms");
  if (rows[0].count > 0) return;
  await pool.query(`INSERT INTO room_types (type_id, label, base_rate) VALUES ('STD','Standard',35000.00), ('JSUITE','Junior Suite',55000.00), ('SSUITE','Senior Suite',80000.00)`);
  await pool.query(`INSERT INTO rooms (room_number, type_id) VALUES (101,'STD'), (102,'STD'), (103,'STD'), (201,'JSUITE'), (202,'JSUITE'), (301,'SSUITE')`);
  console.log("Seeded 3 room types and 6 rooms.");
}
