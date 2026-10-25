const wib = new Intl.DateTimeFormat("id-ID", {
  timeZone: "Asia/Jakarta",
  day: "2-digit",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
});

const et = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  weekday: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

/** e.g. "25 Okt 14.09.33 WIB" */
export function formatWIB(ms: number): string {
  return `${wib.format(new Date(ms))} WIB`;
}

/** e.g. "Fri 16:00 ET" */
export function formatET(ms: number): string {
  return `${et.format(new Date(ms))} ET`;
}
