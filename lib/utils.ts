import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge only knows Tailwind's stock scales. Our `@theme` adds font
 * sizes (`--text-hero` … `--text-micro`) and shadows (`--shadow-glow`,
 * `--shadow-gold`) whose names aren't t-shirt sizes, so the default config
 * falls through to its catch-all validators and files `text-h1`, `text-small`,
 * `text-micro` … under **text-color** rather than font-size.
 *
 * The effect is silent and nasty: any `cn()` call containing both a custom size
 * and a text colour keeps only whichever came last and drops the other — e.g.
 * `size="sm"` buttons lost `text-sand-50` and rendered a near-invisible label,
 * and badges lost `text-micro` and rendered oversized.
 *
 * Registering the custom values in their real groups keeps size and colour in
 * separate conflict groups, so both survive.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        {
          text: [
            "hero",
            "display",
            "h1",
            "h2",
            "h3",
            "h4",
            "lead",
            "body",
            "small",
            "micro",
          ],
        },
      ],
      shadow: [{ shadow: ["glow", "gold"] }],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// Formats Syrian phone numbers into a wa.me link for the WhatsApp API.
export function formatWhatsAppNumber(phone: string) {
  if (!phone) return "";
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("0")) cleaned = cleaned.substring(1);
  if (!cleaned.startsWith("963")) cleaned = "963" + cleaned;
  return `https://wa.me/${cleaned}`;
}

// Strips the "إحداثيات:"/"إحداثيات الخريطة:" prefix map picker writes onto location strings.
export function stripCoordinatesPrefix(value?: string | null) {
  if (!value) return "";
  return value.replace("إحداثيات الخريطة:", "").replace("إحداثيات:", "").trim();
}
