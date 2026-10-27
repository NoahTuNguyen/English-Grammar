// Loads content JSON (rules and packs) once and caches it.
// Packs are listed in content/packs/index.json; adding a file there is all
// it takes for a new pack to show up.

const cache = new Map();

async function getJson(path) {
  if (!cache.has(path)) {
    cache.set(
      path,
      fetch(path).then((r) => {
        if (!r.ok) throw new Error(`Could not load ${path} (${r.status})`);
        return r.json();
      }),
    );
  }
  return cache.get(path);
}

export function rules() {
  return getJson('content/rules.json');
}

// All packs, in index order. A pack that fails to load is skipped (and logged).
export async function packs() {
  const index = await getJson('content/packs/index.json');
  const loaded = await Promise.all(
    index.packs.map((p) =>
      getJson(`content/packs/${p.file}`).catch((e) => {
        console.error(e);
        return null;
      }),
    ),
  );
  return loaded.filter(Boolean);
}

export async function pack(id) {
  return (await packs()).find((p) => p.id === id);
}

export async function unit(packId, unitId) {
  const p = await pack(packId);
  return p && { pack: p, unit: p.units.find((u) => u.id === unitId) };
}
