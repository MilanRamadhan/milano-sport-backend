const isProd = process.env.NODE_ENV === "production";

function base(level, message, meta) {
  const time = new Date().toISOString();
  const payload = meta ? ` | ${JSON.stringify(meta)}` : "";
  const text = `[${level}] ${time}: ${message}${payload}`;

  if (level === "ERROR") console.error(text);
  else if (level === "WARN") console.warn(text);
  else console.log(text);
}

export const logger = {
  info: (message, meta) => base("INFO", message, meta),
  warn: (message, meta) => base("WARN", message, meta),
  error: (message, meta) => base("ERROR", message, meta),
  debug: (message, meta) => {
    if (!isProd) base("DEBUG", message, meta);
  },
};
