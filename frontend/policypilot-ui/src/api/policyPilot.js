const BASE_URL = (process.env.REACT_APP_API_URL || "").replace(/\/$/, "");
const API_TIMEOUT_MS = 90000; // 90s — AI + RAG can take 30-60s on cold start

async function apiRequest(path, options = {}) {
  try {
    if (!BASE_URL) throw new Error("REACT_APP_API_URL is not configured");
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      const res = await fetch(`${BASE_URL}${path}`, {
        credentials: "include",
        ...options,
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("API failed");
      return await res.json();
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (err) {
    if (err.name === "AbortError") {
      console.error("API ERROR:", "Request timed out");
      return { error: "Request timed out. Please try again." };
    }
    console.error("API ERROR:", err);
    return { error: "Failed to fetch response" };
  }
}

// ✅ Find Schemes — sends JSON (backend expects Pydantic model)
export async function findSchemes(citizenProfile) {
  const data = await apiRequest("/find-schemes", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ citizen_profile: citizenProfile }),
  });
  if (data?.error) {
    return { status: "error", schemes: [], sources: [], error: data.error };
  }
  return data;
}

// ✅ Get Checklist
export async function getChecklist(schemeName, citizenProfile) {
  const data = await apiRequest("/get-checklist", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      scheme_name: schemeName,
      citizen_profile: citizenProfile,
    }),
  });
  return data?.error ? { checklist: [], error: data.error } : data;
}

// ✅ Detect Conflict
export async function detectConflict(schemeName) {
  const data = await apiRequest("/detect-conflict", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ scheme_name: schemeName }),
  });
  return data?.error ? { conflict_analysis: "Error detecting conflicts", error: data.error } : data;
}

// ✅ Upload & Fill Form
export async function uploadAndFill(schemeName, file) {
  const form = new FormData();
  form.append("scheme_name", schemeName);
  form.append("document", file);
  const data = await apiRequest("/upload-and-fill", {
    method: "POST",
    body: form,
  });
  return data?.error ? { error: "File upload failed" } : data;
}

// ✅ Index PDFs
export async function indexPdfs() {
  const data = await apiRequest("/index-pdfs", {
    method: "POST",
  });
  return data?.error ? { message: "Indexing failed", error: data.error } : data;
}

// ✅ Health Check
export async function healthCheck() {
  const data = await apiRequest("/health");
  return data?.error ? { status: "backend not reachable", error: data.error } : data;
}