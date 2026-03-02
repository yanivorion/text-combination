import { getStore } from "@netlify/blobs";

const STORE = "tc_creations";
const KEY   = "list";

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

async function readList(store) {
  return (await store.get(KEY, { type: "json" })) || [];
}

async function writeList(store, list) {
  await store.setJSON(KEY, list);
  return list;
}

export default async (req, context) => {
  const store = getStore(STORE);
  const url   = new URL(req.url);

  // GET  — return all creations
  if (req.method === "GET") {
    return json(await readList(store));
  }

  // POST — add a new creation  { name, snap }
  if (req.method === "POST") {
    const { name, snap } = await req.json();
    if (!name || !snap) return json({ error: "name and snap required" }, 400);
    const list = await readList(store);
    list.unshift({ id: Date.now(), name, ts: Date.now(), snap });
    return json(await writeList(store, list));
  }

  // PATCH — rename  ?id=<id>  { name }
  if (req.method === "PATCH") {
    const id = Number(url.searchParams.get("id"));
    const { name } = await req.json();
    if (!id || !name) return json({ error: "id and name required" }, 400);
    const list = await readList(store);
    const item = list.find((c) => c.id === id);
    if (item) item.name = name;
    return json(await writeList(store, list));
  }

  // DELETE — remove  ?id=<id>
  if (req.method === "DELETE") {
    const id = Number(url.searchParams.get("id"));
    if (!id) return json({ error: "id required" }, 400);
    const list = (await readList(store)).filter((c) => c.id !== id);
    return json(await writeList(store, list));
  }

  // PUT — bulk replace (for import)
  if (req.method === "PUT") {
    const list = await req.json();
    if (!Array.isArray(list)) return json({ error: "array required" }, 400);
    return json(await writeList(store, list));
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = {
  path: "/api/creations",
};
