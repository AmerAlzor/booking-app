export type BookingStatus = "pending" | "approved" | "denied" | "cancelled";

export type Booking = {
  id: string;
  dateTimeISO: string;
  partySize: number;
  status: BookingStatus;
  createdAt: string;
  cancelledAt: string | null;
};

export function statusLabel(status: BookingStatus) {
  switch (status) {
    case "pending":
      return "Pågående";
    case "approved":
      return "Godkänd";
    case "denied":
      return "Nekad";
    case "cancelled":
      return "Avbokad";
  }
}

function hoursSince(iso: string) {
  return (Date.now() - new Date(iso).getTime()) / (1000 * 60 * 60);
}

export function canCancel(b: Booking) {
  if (!(b.status === "pending" || b.status === "approved")) return false;
  return hoursSince(b.createdAt) < 24;
}

export function cancelReason(b: Booking) {
  if (b.status === "denied" || b.status === "cancelled") {
    return "Bokningen kan inte avbokas i detta läge.";
  }
  if (hoursSince(b.createdAt) >= 24) {
    return "Du kan bara avboka inom 24 timmar från att bokningen skapades.";
  }
  return "Du kan endast avboka om bokningen är pågående eller godkänd.";
}

export function formatDateTime(iso: string) {
  const d = new Date(iso);
  return {
    date: d.toLocaleDateString(),
    time: d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
  };
}
