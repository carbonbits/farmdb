/** A field's boundary. Fields are polygons only. */
export interface FieldGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

/** What the API accepts to create a field. Extra keys are rejected. */
export interface CreateFieldInput {
  name: string;
  description?: string;
  geometry?: FieldGeometry;
}

/** A field as the API returns it. The area is worked out by the server. */
export interface Field {
  id: string;
  name: string;
  description: string | null;
  geometry: FieldGeometry | null;
  area_ha: number | null;
}
