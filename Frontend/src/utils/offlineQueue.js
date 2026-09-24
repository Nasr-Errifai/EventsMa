const QUEUE_KEY = "offline_scan_queue";
const TICKETS_KEY = "offline_tickets";
const DEVICE_KEY = "device_id";

function getDeviceId() {
  let id = localStorage.getItem(DEVICE_KEY);
  if (!id) {
    id = "device-" + Math.random().toString(36).substring(2, 10);
    localStorage.setItem(DEVICE_KEY, id);
  }
  return id;
}

function enqueueScan(ticketId, qrPayload, qrSignature) {
  const queue = getQueue();
  queue.push({
    ticket_id: ticketId,
    qr_payload: qrPayload,
    qr_signature: qrSignature,
    scanned_at: new Date().toISOString(),
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  return queue.length;
}

function getQueue() {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]");
  } catch {
    return [];
  }
}

function clearQueue() {
  localStorage.removeItem(QUEUE_KEY);
}

function storeOfflineTickets(eventId, tickets, eventTitle) {
  const data = {
    event_id: eventId,
    event_title: eventTitle,
    synced_at: new Date().toISOString(),
    tickets,
  };
  localStorage.setItem(TICKETS_KEY, JSON.stringify(data));
}

function getOfflineTickets() {
  try {
    return JSON.parse(localStorage.getItem(TICKETS_KEY) || "null");
  } catch {
    return null;
  }
}

function findOfflineTicket(ticketId) {
  const data = getOfflineTickets();
  if (!data || !data.tickets) return null;
  return data.tickets.find((t) => t.ticket_id === ticketId) || null;
}

function getQueueCount() {
  return getQueue().length;
}

export default {
  getDeviceId,
  enqueueScan,
  getQueue,
  clearQueue,
  storeOfflineTickets,
  getOfflineTickets,
  findOfflineTicket,
  getQueueCount,
};
