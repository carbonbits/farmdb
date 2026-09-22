"use client";

import { useState } from "react";
import { DeleteConfirm } from "@farmdb/map/components/toolbar/rail/delete-confirm";
import { FieldNameDialog } from "@farmdb/map/components/toolbar/rail/field-name";
import { Flyout } from "@farmdb/map/components/toolbar/rail/flyout";
import { RailButton } from "@farmdb/map/components/toolbar/rail/button";
import { ImportPanel } from "@farmdb/map/components/toolbar/data";
import { DrawToolbar } from "@farmdb/map/components/toolbar/draw/draw-toolbar";
import { EditToolbar } from "@farmdb/map/components/toolbar/draw/edit-toolbar";
import { FeatureDetail } from "@farmdb/map/components/toolbar/info";
import { LayerToggle } from "@farmdb/map/components/toolbar/layers";
import type { useFarmMap } from "@farmdb/map/hooks/use-farm-map";
import { useDrawing, useSelection } from "@farmdb/map/store";

type Controls = ReturnType<typeof useFarmMap>;
type Tool = "layers" | "draw" | "import";

const icon = (d: string) => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth={2}
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
  >
    <path d={d} />
  </svg>
);

const ICONS = {
  zoomIn: "M12 5v14M5 12h14",
  zoomOut: "M5 12h14",
  layers: "M12 2 3 7l9 5 9-5-9-5zM3 12l9 5 9-5M3 17l9 5 9-5",
  draw: "M4 4h16v16H4zM12 9v6M9 12h6",
  import: "M12 20V8M8 12l4-4 4 4M5 4h14",
  edit: "M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4 12.5-12.5z",
  trash: "M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13",
};

/**
 * The map's control rail. Lays out zoom, the tool flyouts (layers, draw,
 * import) and the actions on a selected feature (edit, delete), and owns which
 * flyout is open. Edit and delete act only when a feature is selected. A freshly
 * drawn field opens its name panel on the left. All the work is done by the
 * handlers the map hook passes in.
 */
export function Rail({ controls }: { controls: Controls }) {
  const {
    viewableLayers,
    visible,
    setVisible,
    startDrawing,
    cancelDrawing,
    editSelected,
    saveEdit,
    cancelEditing,
    deleteSelected,
    zoomIn,
    zoomOut,
    importing,
    importResult,
    importError,
    importFile,
    clearImport,
    saveField,
    cancelNaming,
  } = controls;

  const activeLayerId = useDrawing((state) => state.activeLayerId);
  const saveError = useDrawing((state) => state.saveError);
  const namingField = useDrawing((state) => state.namingField);
  const selected = useSelection((state) => state.selected);
  const editing = useSelection((state) => state.editing);
  const deleteError = useSelection((state) => state.deleteError);
  const editError = useSelection((state) => state.editError);
  const setSelected = useSelection((state) => state.setSelected);

  const [openTool, setOpenTool] = useState<Tool | null>(null);
  const [confirmingDelete, setConfirmingDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const toggleTool = (tool: Tool) => {
    setConfirmingDelete(false);
    setOpenTool((current) => (current === tool ? null : tool));
  };

  const canActOnSelection = selected !== null && !editing && !namingField;

  const beginEdit = () => {
    if (!canActOnSelection) return;
    setOpenTool(null);
    setConfirmingDelete(false);
    editSelected();
  };

  const askDelete = () => {
    if (!canActOnSelection) return;
    setOpenTool(null);
    setConfirmingDelete(true);
  };

  const confirmDelete = async () => {
    setDeleting(true);
    await deleteSelected();
    setDeleting(false);
    setConfirmingDelete(false);
  };

  return (
    <>
      {namingField ? (
        <div className="absolute left-3 top-3 z-10">
          <FieldNameDialog error={saveError} onSave={saveField} onCancel={cancelNaming} />
        </div>
      ) : selected && !editing ? (
        <div className="absolute left-3 top-3 z-10">
          <FeatureDetail feature={selected} onClose={() => setSelected(null)} />
        </div>
      ) : null}

      <div className="absolute right-3 top-3 z-10">
        {editing ? (
          <Flyout>
            <EditToolbar editError={editError} onSave={saveEdit} onCancel={cancelEditing} />
          </Flyout>
        ) : confirmingDelete ? (
          <Flyout>
            <DeleteConfirm
              busy={deleting}
              error={deleteError}
              onCancel={() => setConfirmingDelete(false)}
              onConfirm={confirmDelete}
            />
          </Flyout>
        ) : openTool === "layers" ? (
          <Flyout>
            <LayerToggle layers={viewableLayers} visible={visible} onChange={setVisible} />
          </Flyout>
        ) : openTool === "draw" ? (
          <Flyout>
            <DrawToolbar
              layers={viewableLayers}
              activeLayerId={activeLayerId}
              saveError={saveError}
              onDraw={startDrawing}
              onCancel={cancelDrawing}
            />
          </Flyout>
        ) : openTool === "import" ? (
          <Flyout>
            <ImportPanel
              layers={viewableLayers}
              importing={importing}
              result={importResult}
              importError={importError}
              onImport={importFile}
              onClear={clearImport}
            />
          </Flyout>
        ) : null}

        <div className="flex flex-col gap-1 rounded-[14px] border border-[#eadfcb] bg-white/95 p-2 shadow-md backdrop-blur">
          <RailButton icon={icon(ICONS.zoomIn)} label="Zoom in" onClick={zoomIn} />
          <RailButton icon={icon(ICONS.zoomOut)} label="Zoom out" onClick={zoomOut} />
          <div className="mx-1.5 my-1 h-px bg-[#eadfcb]" />
          <RailButton
            icon={icon(ICONS.layers)}
            label="Layers"
            active={openTool === "layers"}
            disabled={editing || namingField}
            onClick={() => toggleTool("layers")}
          />
          <RailButton
            icon={icon(ICONS.draw)}
            label="Draw"
            active={openTool === "draw"}
            disabled={editing || namingField}
            onClick={() => toggleTool("draw")}
          />
          <RailButton
            icon={icon(ICONS.import)}
            label="Import"
            active={openTool === "import"}
            disabled={editing || namingField}
            onClick={() => toggleTool("import")}
          />
          <div className="mx-1.5 my-1 h-px bg-[#eadfcb]" />
          <RailButton icon={icon(ICONS.edit)} label="Edit selected" onClick={beginEdit} />
          <RailButton icon={icon(ICONS.trash)} label="Delete selected" onClick={askDelete} />
        </div>
      </div>
    </>
  );
}