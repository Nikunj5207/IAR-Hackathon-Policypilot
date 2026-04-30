// 🔥 IMPORTANT: Backend URL
const BASE_URL = process.env.REACT_APP_API_URL || "";

// ✅ Find Schemes — sends JSON (backend expects Pydantic model)
export async function findSchemes(citizenProfile) {
  try {
    const res = await fetch(`${BASE_URL}/find-schemes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ citizen_profile: citizenProfile }),
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    const data = await res.json();

    // ✅ return full data (VERY IMPORTANT for UI)
    return data;

  } catch (error) {
    console.error("findSchemes Error:", error);
    return {
      status: "error",
      schemes: [],
      sources: [],
    };
  }
}

// ✅ Get Checklist
export async function getChecklist(schemeName, citizenProfile) {
  try {
    const res = await fetch(`${BASE_URL}/get-checklist`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scheme_name: schemeName, citizen_profile: citizenProfile }),
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    return await res.json();

  } catch (error) {
    console.error("Checklist Error:", error);
    return { checklist: [] };
  }
}

// ✅ Detect Conflict
export async function detectConflict(schemeName) {
  try {
    const res = await fetch(`${BASE_URL}/detect-conflict`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ scheme_name: schemeName }),
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    return await res.json();

  } catch (error) {
    console.error("Conflict Error:", error);
    return { conflict_analysis: "Error detecting conflicts" };
  }
}

// ✅ Upload & Fill Form
export async function uploadAndFill(schemeName, file) {
  try {
    const form = new FormData();
    form.append("scheme_name", schemeName);
    form.append("document", file);

    const res = await fetch(`${BASE_URL}/upload-and-fill`, {
      method: "POST",
      body: form,
    });

    if (!res.ok) {
      throw new Error(`API Error: ${res.status}`);
    }

    return await res.json();

  } catch (error) {
    console.error("Upload Error:", error);
    return { error: "File upload failed" };
  }
}

// ✅ Index PDFs
export async function indexPdfs() {
  try {
    const res = await fetch(`${BASE_URL}/index-pdfs`, {
      method: "POST",
    });

    return await res.json();

  } catch (error) {
    console.error("Index Error:", error);
    return { message: "Indexing failed" };
  }
}

// ✅ Health Check
export async function healthCheck() {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return await res.json();

  } catch (error) {
    console.error("Health Error:", error);
    return { status: "backend not reachable" };
  }
}