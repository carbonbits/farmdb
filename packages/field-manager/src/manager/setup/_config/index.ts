/** The map layer that holds the farm boundary. */
export const FARM_LAYER_ID = "farm";

/** The map layers drawn inside the boundary that are not fields. */
export const FEATURE_LAYER_IDS = ["paddocks", "structures", "water"] as const;

/** How the land is held. "Other" covers arrangements the list does not name. */
export const TENURE_OPTIONS = ["Freehold title", "Leasehold", "Communal land", "Other"] as const;

export type SetupStep = "boundary" | "features" | "members" | "review";

/** The setup steps in order, with the heading and line each shows. */
export const SETUP_STEPS: { id: SetupStep; label: string; description: string }[] = [
  {
    id: "boundary",
    label: "Boundary",
    description:
      "Name the farm and trace its outer edge. Everything else in the builder is locked until " +
      "the boundary closes — nothing can sit on land the instance does not know about.",
  },
  {
    id: "features",
    label: "Fields & features",
    description: "Draw the fields, paddocks, structures and water that sit inside the boundary.",
  },
  {
    id: "members",
    label: "Members",
    description: "Who works on this farm, and what each person may do.",
  },
  {
    id: "review",
    label: "Review",
    description: "Check what is saved before you finish.",
  },
];

/** A shape needs at least three corners to enclose any land. */
export const MINIMUM_CORNERS = 3;

/**
 * The permissions the farm layer asks for, mirroring its row in the server's
 * layer registry. The API does not send a layer's permission keys yet, so they
 * are copied here, in one place. The server still checks every change.
 */
export const BOUNDARY_EDIT_PERMISSION = "fields.geometry";
export const BOUNDARY_DELETE_PERMISSION = "fields.geometry";
