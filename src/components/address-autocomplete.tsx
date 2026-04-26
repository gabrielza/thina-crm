"use client";

import { useEffect, useRef, useState } from "react";
import { importLibrary, setOptions } from "@googlemaps/js-api-loader";
import { Input } from "@/components/ui/input";
import { Loader2 } from "lucide-react";

/**
 * Geocoded place returned by the server-side /api/places/resolve proxy.
 * Mirrors the PlaceCacheDoc shape stored in the `places` Firestore collection.
 */
export interface ResolvedPlace {
  placeId: string;
  formattedAddress: string;
  lat: number;
  lng: number;
  suburb: string;
  city: string;
  province: string;
  country: string;
  postalCode: string;
  fromCache?: boolean;
}

interface AddressAutocompleteProps {
  /** Initial display value (e.g. when editing an existing record). */
  initialValue?: string;
  /** Called when the user picks a result and the server resolves it. */
  onSelect: (place: ResolvedPlace) => void;
  /** Provide an auth bearer token (Firebase ID token) for the resolve call. */
  getIdToken: () => Promise<string>;
  /** Restrict autocomplete to a single ISO country (default "za"). */
  country?: string;
  /** Placeholder shown in the input. */
  placeholder?: string;
  /** Optional id for label association. */
  id?: string;
}

// One-time options init for the Maps JS API loader (v2 functional API).
let mapsConfigured = false;
function configureMaps(): boolean {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
  if (!apiKey) return false;
  if (!mapsConfigured) {
    setOptions({ key: apiKey, v: "weekly", libraries: ["places"] });
    mapsConfigured = true;
  }
  return true;
}

/**
 * Google Places address autocomplete using the new `PlaceAutocompleteElement`
 * web component. On selection, the place ID is sent to the server proxy which
 * fetches Place Details, caches the result in Firestore, and returns the
 * normalised geocoded fields.
 */
export function AddressAutocomplete({
  initialValue,
  onSelect,
  getIdToken,
  country = "za",
  placeholder = "Start typing an address…",
  id,
}: AddressAutocompleteProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const fallbackRef = useRef<HTMLInputElement | null>(null);
  const [resolving, setResolving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [unsupported, setUnsupported] = useState(false);

  const loader = configureMaps();

  useEffect(() => {
    if (!loader || !containerRef.current) return;

    let cancelled = false;
    let element: HTMLElement | null = null;

    (async () => {
      try {
        await importLibrary("places");
        if (cancelled || !containerRef.current) return;

        // The new element is registered as a custom element by the Maps JS API.
        const ElementCtor =
          (
            window.google?.maps?.places as unknown as {
              PlaceAutocompleteElement?: new (opts?: Record<string, unknown>) => HTMLElement;
            }
          )?.PlaceAutocompleteElement;

        if (!ElementCtor) {
          setUnsupported(true);
          return;
        }

        element = new ElementCtor({
          includedRegionCodes: [country],
          // We only need addresses (not generic places / businesses) for CMA work.
          types: ["address"],
        });
        element.id = id ?? "address-autocomplete";
        // Style the embedded input to match shadcn `<Input />` height.
        element.setAttribute("style", "width: 100%; --gmpx-color-surface: transparent;");

        containerRef.current.replaceChildren(element);

        element.addEventListener("gmp-select", async (event: Event) => {
          // The event payload contains a Place reference with the chosen placeId.
          // Type the event loosely — Maps types lag the real API.
          const ev = event as unknown as {
            placePrediction?: {
              toPlace?: () => { id?: string };
            };
          };
          const placeId = ev.placePrediction?.toPlace?.()?.id;
          if (!placeId) return;

          setResolving(true);
          setError(null);
          try {
            const token = await getIdToken();
            const resp = await fetch("/api/places/resolve", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ placeId }),
            });
            const json = await resp.json();
            if (!resp.ok) {
              setError(json.error || "Could not resolve address");
              return;
            }
            onSelect(json as ResolvedPlace);
          } catch (err) {
            setError(err instanceof Error ? err.message : "Lookup failed");
          } finally {
            setResolving(false);
          }
        });

        setReady(true);
      } catch (err) {
        console.error("[AddressAutocomplete] Maps load failed:", err);
        setUnsupported(true);
      }
    })();

    return () => {
      cancelled = true;
      if (element && element.parentElement) {
        element.parentElement.removeChild(element);
      }
    };
    // Only re-init when the country prop changes — onSelect / getIdToken are
    // intentionally captured by reference inside the listener.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [country, id]);

  // No API key configured, or the new element isn't available — fall back to a
  // plain text input so the form still works.
  if (!loader || unsupported) {
    return (
      <div className="space-y-1">
        <Input
          ref={fallbackRef}
          id={id}
          defaultValue={initialValue}
          placeholder={placeholder}
          onBlur={(e) => {
            const value = e.target.value.trim();
            if (!value) return;
            onSelect({
              placeId: "",
              formattedAddress: value,
              lat: 0,
              lng: 0,
              suburb: "",
              city: "",
              province: "",
              country: "",
              postalCode: "",
            });
          }}
        />
        <p className="text-xs text-muted-foreground">
          Address autocomplete is unavailable — type the address manually.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <div ref={containerRef} className="min-h-[40px]" />
      {!ready && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Loading address search…
        </p>
      )}
      {resolving && (
        <p className="text-xs text-muted-foreground flex items-center gap-1">
          <Loader2 className="h-3 w-3 animate-spin" /> Looking up address…
        </p>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
