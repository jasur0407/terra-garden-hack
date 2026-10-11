// The daily GitHub Action writes public/data/latest.json; Vite serves it next to the page.
export async function loadLatest() {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}data/latest.json?t=${Date.now()}`, { cache: 'no-store' });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
