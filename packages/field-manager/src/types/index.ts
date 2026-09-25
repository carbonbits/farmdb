import type { components } from "@farmdb/api-client";

type FarmFieldSchema = components["schemas"]["FarmField"];
type CreateFarmFieldSchema = components["schemas"]["CreateFarmFieldInput"];

/** A field's boundary. The API types it as any object; fields are polygons only. */
export interface FieldGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

/** A field as the API returns it, with its boundary narrowed to a polygon. */
export type Field = Omit<FarmFieldSchema, "geometry"> & {
  geometry?: FieldGeometry | null;
};

/** What the API accepts to create a field, with the boundary narrowed to a polygon. */
export type CreateFieldInput = Omit<CreateFarmFieldSchema, "geometry"> & {
  geometry?: FieldGeometry | null;
};
