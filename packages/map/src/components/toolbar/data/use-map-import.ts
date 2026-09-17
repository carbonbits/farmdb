"use client";
import type { ApiClient as GeoApiClient } from "@farmdb/geo/client";
import type { ImportFeatureInput, ImportResult } from "@farmdb/geo/types";
import { type RefObject, useState } from "react";
import type { MapLayer } from "@farmdb/map/lib/layers";

/**
 * Reads a GeoJSON file and sends its features to a layer. Holds the outcome of
 * the last import and the reason it failed, and clears both when a new one
 * starts. The map lifecycle hook owns the client and the token, so this takes
 * the refs it holds rather than making its own.
 */
export function useMapImport(
  clientRef: RefObject<GeoApiClient | null>,
  tokenRef: RefObject<string | null>,
  onImported: (layerId: string) => void,
) {
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importError, setImportError] = useState<string | null>(null);

  async function importFile(layer: MapLayer, file: File, season?: string): Promise<void> {
    const client = clientRef.current;
    const token = tokenRef.current;
    if (!client || !token) return;

    setImporting(true);
    setResult(null);
    setImportError(null);

    try {
      const features = readFeatures(await file.text());
      const outcome = await client.importFeatures(token, layer.id, features, season);
      setResult(outcome);
      if (outcome.imported > 0) onImported(layer.id);
    } catch (error) {
      setImportError(importFailureMessage(error));
    } finally {
      setImporting(false);
    }
  }

  function clearImport(): void {
    setResult(null);
    setImportError(null);
  }

  return { importing, result, importError, importFile, clearImport };
}

/**
 * The features held in a GeoJSON file. Throws when the text is not a feature
 * collection, so nothing is sent when the file cannot be read. The file comes
 * from the user's disk so its shape is not trusted: each step asks a real
 * question of it rather than assuming it is valid.
 */
function readFeatures(text: string): ImportFeatureInput[] {
  let document: unknown;
  try {
    document = JSON.parse(text);
  } catch {
    throw new Error("That file is not valid JSON.");
  }

  const features = (document as { features?: unknown })?.features;
  if (!Array.isArray(features)) {
    throw new Error("That file has no features. Choose a GeoJSON FeatureCollection.");
  }
  if (features.length === 0) {
    throw new Error("That file has no features in it.");
  }

  return features.map(toImportFeature);
}

/**
 * One raw feature from a file turned into what the api expects. A missing
 * geometry becomes null, which the api then refuses per feature with a reason.
 */
function toImportFeature(raw: unknown): ImportFeatureInput {
  const feature = raw as { geometry?: unknown; properties?: Record<string, unknown> | null };
  return {
    geometry: feature?.geometry ?? null,
    properties: feature?.properties ?? null,
  };
}

/**
 * The reason the import failed, in words a user can act on.
 */
function importFailureMessage(error: unknown): string {
  if (error instanceof Error && error.message) return error.message;
  return "The file could not be imported. Check your connection and try again.";
}