import fs from "fs";
import path from "path";

// pastikan folder logs ada
const logDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir);
}

const logToFile = (filename, message) => {
  const filePath = path.join(logDir, filename);
  fs.appendFileSync(filePath, message + "\n", "utf8");
};

const formatLog = (level, message) => `[${level}] ${new Date().toISOString()} - ${message}`;

export const logger = {
  info: (message) => {
    const log = formatLog("INFO", message);
    console.log(log);
    logToFile("app.log", log);
  },

  warn: (message) => {
    const log = formatLog("WARN", message);
    console.warn(log);
    logToFile("app.log", log);
  },

  error: (message) => {
    const log = formatLog("ERROR", message);
    console.error(log);
    logToFile("error.log", log);
  },

  debug: (message) => {
    if (process.env.NODE_ENV === "development") {
      const log = formatLog("DEBUG", message);
      console.log(log);
      logToFile("debug.log", log);
    }
  },
};
