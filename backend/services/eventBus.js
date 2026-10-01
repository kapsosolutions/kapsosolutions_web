// Tiny event bus so services can emit CRM socket events without importing the
// Socket.IO server directly. server.js registers the io instance via setIO().
let io = null;

export function setIO(instance) {
  io = instance;
}

export function emitMessage(message) {
  if (io) io.emit('crm:message', message);
}

export function emitDemo(lead) {
  if (io) io.emit('crm:demo', lead);
}

export function emitStatus(update) {
  if (io) io.emit('crm:status', update);
}

export function emitReaction(update) {
  if (io) io.emit('crm:reaction', update);
}

export default { setIO, emitMessage, emitDemo, emitStatus, emitReaction };
