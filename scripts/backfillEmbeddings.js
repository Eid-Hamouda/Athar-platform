/**
 * Backfills `donations.embedding` for rows created before smart matching
 * existed.
 *
 *   node scripts/backfillEmbeddings.js
 *
 * New donations are embedded at creation by the donor's own session, so this
 * is a one-off for the existing catalogue. Rows left without an embedding
 * still match correctly — they are just embedded again on every cache miss,
 * which is the cost this removes.
 *
 * Requires SUPABASE_SERVICE_ROLE_KEY: row-level security lets each donor write
 * only their own donations, and a backfill writes everyone's. Find it under
 * Project Settings → API → service_role in the Supabase dashboard, and keep it
 * out of version control — it bypasses RLS entirely.
 *
 * Re-run this if `donationToText` in services/aiMatchingService.ts changes, so
 * stored vectors keep describing the same text the engine now builds.
 */
const { createClient } = require("@supabase/supabase-js");
const { GoogleGenAI } = require("@google/genai");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const geminiKey = process.env.GEMINI_API_KEY;

if (!supabaseUrl || !serviceKey) {
  console.error(
    "❌ Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local"
  );
  process.exit(1);
}
if (!geminiKey) {
  console.error("❌ Missing GEMINI_API_KEY in .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
  auth: { persistSession: false },
});
const ai = new GoogleGenAI({ apiKey: geminiKey });

// Must stay identical to donationToText() in services/aiMatchingService.ts.
const donationToText = (d) =>
  [
    d.title,
    d.category,
    d.sub_category,
    d.condition ? `الحالة: ${d.condition}` : null,
    d.description,
  ]
    .map((part) => (part || "").trim())
    .filter(Boolean)
    .join(" — ");

const BATCH_SIZE = 20;

async function backfill() {
  const { data: rows, error } = await supabase
    .from("donations")
    .select("id, title, category, sub_category, condition, description")
    .is("embedding", null);

  if (error) {
    if (error.code === "42703") {
      console.error(
        "❌ The `embedding` column does not exist yet. Run supabase/migrations/0001_smart_matching.sql first."
      );
      process.exit(1);
    }
    console.error("❌ Could not read donations:", error.message);
    process.exit(1);
  }

  const pending = (rows || []).filter((row) => donationToText(row));
  if (pending.length === 0) {
    console.log("✅ Nothing to backfill — every donation already has an embedding.");
    return;
  }

  console.log(`🌱 Embedding ${pending.length} donation(s)…`);
  let written = 0;

  for (let start = 0; start < pending.length; start += BATCH_SIZE) {
    const batch = pending.slice(start, start + BATCH_SIZE);

    let response;
    try {
      response = await ai.models.embedContent({
        model: "gemini-embedding-001",
        contents: batch.map(donationToText),
        config: { taskType: "RETRIEVAL_DOCUMENT", outputDimensionality: 768 },
      });
    } catch (err) {
      console.error(`⚠️  Batch starting at ${start} failed:`, err.message || err);
      continue;
    }

    for (let i = 0; i < batch.length; i += 1) {
      const vector = response.embeddings?.[i]?.values;
      if (!vector) continue;

      const { error: updateError } = await supabase
        .from("donations")
        .update({ embedding: vector })
        .eq("id", batch[i].id);

      if (updateError) {
        console.error(`⚠️  ${batch[i].id}: ${updateError.message}`);
      } else {
        written += 1;
      }
    }

    console.log(`   … ${Math.min(start + BATCH_SIZE, pending.length)}/${pending.length}`);
  }

  console.log(`🏁 Done. ${written} of ${pending.length} donation(s) embedded.`);
}

backfill().catch((err) => {
  console.error("❌ Backfill failed:", err);
  process.exit(1);
});
