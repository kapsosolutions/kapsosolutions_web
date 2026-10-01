// Minimal structured logger.
const ts = () => new Date().toISOString();
const fmt = (level, msg, meta) =>
  `[${ts()}] ${level.toUpperCase()} ${msg}${meta ? ' ' + JSON.stringify(meta) : ''}`;

const logger = {
  info: (msg, meta) => console.log(fmt('info', msg, meta)),
  warn: (msg, meta) => console.warn(fmt('warn', msg, meta)),
  error: (msg, meta) => console.error(fmt('error', msg, meta)),
  debug: (msg, meta) => {
    if (process.env.LOG_DEBUG === '1') console.log(fmt('debug', msg, meta));
  }
};

export default logger;
