/**
 * Utilitários de validação temporal para agendamento e reagendamento.
 * Centraliza a lógica de verificação de datas e horários passados para
 * garantir consistência entre os fluxos de novo agendamento e reagendamento.
 */

/**
 * Formata ano, mês (0-11) e dia para o formato YYYY-MM-DD.
 */
export function toDateString(
  year: number,
  month: number,
  day: number
): string {
  const m = String(month + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Constrói string ISO local no formato YYYY-MM-DDTHH:mm:00 a partir da data e do slot de horário.
 */
export function buildStartDateTime(
  dateStr: string,
  slot: string
): string {
  // Slot já é ISO completo
  if (slot.includes('T') || slot.includes('Z')) {
    return slot;
  }
  const timePart = slot.slice(0, 5);
  return `${dateStr}T${timePart}:00`;
}

/**
 * Verifica se um dia do calendário é anterior à data de hoje (comparação apenas de dia, 00:00:00).
 * Retorna true se a data selecionada for estritamente anterior a hoje.
 */
export function isPastDay(
  year: number,
  month: number,
  day: number
): boolean {
  const now = new Date();
  const selectedDate = new Date(year, month, day);
  const todayDate = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  return selectedDate < todayDate;
}

/**
 * Verifica se um determinado horário em um dia específico é anterior ou igual ao momento atual.
 * Trata corretamente o caso de "hoje": horários passados de hoje retornam true,
 * enquanto horários futuros de hoje continuam válidos (retornam false).
 */
export function isPastDateTime(
  year: number,
  month: number,
  day: number,
  slot: string
): boolean {
  const dateStr = toDateString(year, month, day);
  const startDateTime = buildStartDateTime(dateStr, slot);
  return isPastIso(startDateTime);
}

/**
 * Verifica se uma data-hora ISO é anterior ou igual a agora.
 */
export function isPastIso(isoString: string): boolean {
  if (!isoString) return false;
  const time = new Date(isoString).getTime();
  if (isNaN(time)) return false;
  return time <= Date.now();
}
