"use client";

import { DrawToolbar } from "./components/draw-toolbar";
import { EditToolbar } from "./components/edit-toolbar";
import { FeatureDetail } from "./components/feature-detail";
import { LayerToggle } from "./components/layer-toggle";
import { useFarmMap } from "./hooks/use-farm-map";
import { useDrawing, useSelection } from "./store";

export function FarmMap() {
  const {
    containerRef,
    viewableLayers,
    visible,
    setVisible,
    deleteSelected,
    editSelected,
    saveEdit,
    cancelEditing,
    startDrawing,
    cancelDrawing,
  } = useFarmMap();
  const activeLayerId = useDrawing((state) => state.activeLayerId);
  const saveFailed = useDrawing((state) => state.saveFailed);
  const selected = useSelection((state) => state.selected);
  const editing = useSelection((state) => state.editing);
  const deleteError = useSelection((state) => state.deleteError);
  const editError = useSelection((state) => state.editError);
  const setSelected = useSelection((state) => state.setSelected);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <LayerToggle layers={viewableLayers} visible={visible} onChange={setVisible} />
      <DrawToolbar
        layers={viewableLayers}
        activeLayerId={activeLayerId}
        saveFailed={saveFailed}
        onDraw={startDrawing}
        onCancel={cancelDrawing}
      />
      {editing && <EditToolbar editError={editError} onSave={saveEdit} onCancel={cancelEditing} />}
      {!editing && selected && (
        <FeatureDetail
          feature={selected}
          deleteError={deleteError}
          onClose={() => setSelected(null)}
          onEdit={editSelected}
          onDelete={deleteSelected}
        />
      )}
    </div>
  );
}