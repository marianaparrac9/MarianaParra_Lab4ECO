export function statusLabel(status: string) {
  if (status === "waiting_for_deliver") return "creado";
  if (status === "in_progress") return "en entrega";
  if (status === "delivered") return "entregado";
  return status;
}

export function statusClass(status: string) {
  if (status === "waiting_for_deliver") return "badge created";
  if (status === "in_progress") return "badge going";
  if (status === "delivered") return "badge done";
  return "badge";
}
