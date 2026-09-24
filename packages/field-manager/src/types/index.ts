// A field's boundary. Fields are polygons only (CORE-443 validation).
export interface FieldGeometry {
  type: "Polygon";
  coordinates: number[][][];
}

// Sent by the save dialog to create a field: name is required, description
// optional, geometry is the drawn boundary. Mirrors the backend
// CreateFarmFieldInput, which forbids extra keys — so we send nothing else.
export interface CreateFieldInput {
  name: string;
  description?: string;
  geometry: FieldGeometry;
}

// A field as the api returns it. area_ha is computed server-side.
export interface Field {
  id: string;
  name: string;
  description: string | null;
  geometry: FieldGeometry | null;
  area_ha: number | null;
}