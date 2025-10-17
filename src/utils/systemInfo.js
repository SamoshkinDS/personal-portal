// encoding: utf-8
export async function getServerStats() {
  try {
    const res = await fetch("http://localhost:4000/api/system-stats");
    if (!res.ok) throw new Error("Server error");
    return await res.json();
  } catch {
    // Mock данные для локальной разработки
    return {
      cpu: Math.round(Math.random() * 50 * 10) / 10,
      disk: Math.round(Math.random() * 80 * 10) / 10,
      bandwidth: {
        in: Math.round(Math.random() * 5000),
        out: Math.round(Math.random() * 3000),
      },
      uptime: "3 days 14h 22m",
    };
  }
}
