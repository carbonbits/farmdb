"use client";

import { Toolbar } from "@farmdb/map/components/toolbar";
import { ImportPanel } from "@farmdb/map/components/toolbar/data";
import { DrawToolbar } from "@farmdb/map/components/toolbar/draw/draw-toolbar";
import { EditToolbar } from "@farmdb/map/components/toolbar/draw/edit-toolbar";
import { FeatureDetail } from "@farmdb/map/components/toolbar/info";
import { LayerToggle } from "@farmdb/map/components/toolbar/layers";
import { ZoomControl } from "@farmdb/map/components/toolbar/zoom";
import { useFarmMap } from "@farmdb/map/hooks/use-farm-map";
import { useDrawing, useSelection } from "@farmdb/map/store";

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
    zoomIn,
    zoomOut,
    importing,
    importResult,
    importError,
    importFile,
    clearImport,
  } = useFarmMap();
  const activeLayerId = useDrawing((state) => state.activeLayerId);
  const saveError = useDrawing((state) => state.saveError);
  const selected = useSelection((state) => state.selected);
  const editing = useSelection((state) => state.editing);
  const deleteError = useSelection((state) => state.deleteError);
  const editError = useSelection((state) => state.editError);
  const setSelected = useSelection((state) => state.setSelected);

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="h-full w-full" />
      <Toolbar
        topLeft={<LayerToggle layers={viewableLayers} visible={visible} onChange={setVisible} />}
        topRight={
          <>
            <ZoomControl onZoomIn={zoomIn} onZoomOut={zoomOut} />
            {editing ? (
              <EditToolbar editError={editError} onSave={saveEdit} onCancel={cancelEditing} />
            ) : selected ? (
              <FeatureDetail
                feature={selected}
                deleteError={deleteError}
                onClose={() => setSelected(null)}
                onEdit={editSelected}
                onDelete={deleteSelected}
              />
            ) : null}
          </>
        }
        bottomLeft={
          <>
            <DrawToolbar
              layers={viewableLayers}
              activeLayerId={activeLayerId}
              saveError={saveError}
              onDraw={startDrawing}
              onCancel={cancelDrawing}
            />
            <ImportPanel
              layers={viewableLayers}
              importing={importing}
              result={importResult}
              importError={importError}
              onImport={importFile}
              onClear={clearImport}
            />
          </>
        }
      />
    </div>
  );
}