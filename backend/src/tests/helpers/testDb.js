/**
 * Sets up a clean test database before each suite.
 * Uses DATABASE_URL from .env but switches the db name to glycofriend_test.
 */
const { execSync } = require("child_process");
const path = require("path");

const TEST_DB_URL = (process.env.DATABASE_URL || "postgresql://glycofriend:glycofriend@localhost:5432/glycofriend")
  .replace(/\/glycofriend(\?|$)/, "/glycofriend_test$1");

process.env.DATABASE_URL = TEST_DB_URL;
process.env.NODE_ENV = "test";
process.env.JWT_SECRET = "test_secret";
process.env.SENDGRID_API_KEY = "test";
process.env.SENDGRID_FROM_EMAIL = "test@glycofriend.rw";
process.env.AFRICAS_TALKING_API_KEY = "test";
process.env.AFRICAS_TALKING_USERNAME = "sandbox";

function migrateTestDb() {
  execSync("npx prisma migrate deploy", {
    cwd: path.resolve(__dirname, "../../../"),
    env: { ...process.env, DATABASE_URL: TEST_DB_URL },
    stdio: "pipe",
  });
}

module.exports = { TEST_DB_URL, migrateTestDb };
