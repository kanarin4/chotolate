import { DndContext, DragOverlay } from '@dnd-kit/core'
import { TileDragOverlay } from './components/Tile/TileDragOverlay'
import { AppShell } from './containers/AppShell'
import { useAutoSave } from './hooks/useAutoSave'
import { useDragAndDrop } from './hooks/useDragAndDrop'
import { cursorCollision } from './utils/collision'

function App() {
  useAutoSave()

  const {
    sensors,
    activeTile,
    dropAnimation,
    handleDragStart,
    handleDragMove,
    handleDragOver,
    handleDragEnd,
    handleDragCancel,
  } = useDragAndDrop()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={cursorCollision}
      onDragStart={handleDragStart}
      onDragMove={handleDragMove}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <AppShell />

      <DragOverlay dropAnimation={dropAnimation}>
        <TileDragOverlay tile={activeTile} />
      </DragOverlay>
    </DndContext>
  )
}

export default App
