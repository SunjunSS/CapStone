<template>
  <div 
    class="mindmap-wrapper"
    @mousedown="startDrag"
    @mouseup="stopDrag"
    @mousemove="dragMove"
    @mouseleave="stopDrag"
    @touchstart="startTouch"
    @touchmove="touchMove"
    @touchend="stopTouch"
  >
    <div class="mindmap-container">
      <div ref="diagramDiv" class="mindmap-content"></div>
    </div>
    
    <div class="zoom-controls">
      <button @click="decreaseZoom" class="zoom-btn">-</button>
      <span class="zoom-level">{{ Math.round(currentZoom * 100) }}%</span>
      <button @click="increaseZoom" class="zoom-btn">+</button>
    </div>

    <div class="delete-control">
      <button 
        @click="deleteSelectedNode" 
        class="delete-btn"
        :class="{ 'delete-btn-enabled': selectedNode }"
        :disabled="!selectedNode"
      >
        Delete Node
      </button>
    </div>

    <!-- 노드 추가 컨트롤 -->
    <div v-if="selectedNode" class="add-controls">
      <button @click="addChildNode" class="add-btn">
        하위레벨 추가
      </button>
      <button @click="addSiblingNode" class="add-btn">
        동일레벨 추가
      </button>
    </div>
  </div>
</template>

<script>
import { ref, onMounted } from 'vue'
import * as go from 'gojs'

export default {
  setup() {
    const diagramDiv = ref(null)
    let myDiagram = null
    const currentZoom = ref(1)
    const selectedNode = ref(null)
    const MIN_ZOOM = 0.2
    const MAX_ZOOM = 2
    const ZOOM_STEP = 0.1
    const ZOOM_BUTTON_STEP = 0.2
    const ANIMATION_DURATION = 300
    const PAN_ANIMATION_DURATION = 100

    const isDragging = ref(false)
    const isNodeDragging = ref(false)
    const lastMousePosition = ref({ x: 0, y: 0 })
    const lastTouchPosition = ref({ x: 0, y: 0 })
    const touchStartTime = ref(0)
    const initialTouchDistance = ref(0)
    let zoomAnimationFrame = null
    let panAnimationFrame = null
    let targetPosition = null

    const deleteSelectedNode = () => {
      if (!selectedNode.value || !myDiagram) return

      myDiagram.startTransaction("delete node")
      
      const node = myDiagram.findNodeForKey(selectedNode.value.key)
      if (node) {
        const nodesToDelete = new Set()
        
        const collectDescendants = (node) => {
          nodesToDelete.add(node.data.key)
          node.findTreeChildrenNodes().each(child => {
            collectDescendants(child)
          })
        }
        
        collectDescendants(node)
        
        const nodeDataArray = myDiagram.model.nodeDataArray.filter(node => 
          !nodesToDelete.has(node.key)
        )
        
        myDiagram.model.nodeDataArray = nodeDataArray
      }
      
      myDiagram.commitTransaction("delete node")
      selectedNode.value = null
    }

    const animateZoom = (startZoom, targetZoom, startTime, duration) => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      
      if (elapsed >= duration) {
        applyZoom(targetZoom)
        zoomAnimationFrame = null
        return
      }

      const progress = elapsed / duration
      const easeProgress = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2

      const currentZoomLevel = startZoom + (targetZoom - startZoom) * easeProgress
      applyZoom(currentZoomLevel)

      zoomAnimationFrame = requestAnimationFrame(() => {
        animateZoom(startZoom, targetZoom, startTime, duration)
      })
    }

    const animatePanning = (startPos, targetPos, startTime, duration) => {
      const currentTime = Date.now()
      const elapsed = currentTime - startTime
      
      if (elapsed >= duration) {
        myDiagram.position = targetPos
        panAnimationFrame = null
        return
      }

      const progress = elapsed / duration
      const easeProgress = 1 - (1 - progress) * (1 - progress)

      const currentX = startPos.x + (targetPos.x - startPos.x) * easeProgress
      const currentY = startPos.y + (targetPos.y - startPos.y) * easeProgress
      
      myDiagram.position = new go.Point(currentX, currentY)

      panAnimationFrame = requestAnimationFrame(() => {
        animatePanning(startPos, targetPos, startTime, duration)
      })
    }

    const startPanAnimation = (newPos) => {
      if (panAnimationFrame) {
        cancelAnimationFrame(panAnimationFrame)
      }
      
      const startPos = myDiagram.position.copy()
      animatePanning(startPos, newPos, Date.now(), PAN_ANIMATION_DURATION)
    }

    const applyZoom = (newZoomLevel) => {
      if (myDiagram) {
        myDiagram.startTransaction("change zoom")
        myDiagram.scale = newZoomLevel
        myDiagram.commitTransaction("change zoom")
        currentZoom.value = myDiagram.scale
      }
    }

    const startZoomAnimation = (targetZoom) => {
      if (zoomAnimationFrame) {
        cancelAnimationFrame(zoomAnimationFrame)
      }
      
      const startZoom = currentZoom.value
      animateZoom(startZoom, targetZoom, Date.now(), ANIMATION_DURATION)
    }

    const increaseZoom = () => {
      if (currentZoom.value < MAX_ZOOM) {
        const newZoomLevel = Math.min(currentZoom.value + ZOOM_BUTTON_STEP, MAX_ZOOM)
        startZoomAnimation(newZoomLevel)
      }
    }

    const decreaseZoom = () => {
      if (currentZoom.value > MIN_ZOOM) {
        const newZoomLevel = Math.max(currentZoom.value - ZOOM_BUTTON_STEP, MIN_ZOOM)
        startZoomAnimation(newZoomLevel)
      }
    }

    const onWheel = (event) => {
      return
    }

    const startDrag = (event) => {
      if (!myDiagram) return
      isDragging.value = true
      lastMousePosition.value = {
        x: event.clientX,
        y: event.clientY
      }
    }

    const stopDrag = () => {
      isDragging.value = false
      isNodeDragging.value = false
    }

    const dragMove = (event) => {
      if (!isDragging.value || !myDiagram || isNodeDragging.value) return

      const dx = (event.clientX - lastMousePosition.value.x) / myDiagram.scale
      const dy = (event.clientY - lastMousePosition.value.y) / myDiagram.scale

      const currentPos = myDiagram.position
      const newPos = new go.Point(
        currentPos.x - dx,
        currentPos.y - dy
      )
      
      startPanAnimation(newPos)

      lastMousePosition.value = {
        x: event.clientX,
        y: event.clientY
      }
    }

    const getTouchDistance = (touches) => {
      const dx = touches[0].clientX - touches[1].clientX
      const dy = touches[0].clientY - touches[1].clientY
      return Math.sqrt(dx * dx + dy * dy)
    }

    const startTouch = (event) => {
      if (!myDiagram) return
      
      touchStartTime.value = Date.now()
      
      if (event.touches.length === 1) {
        isDragging.value = true
        lastTouchPosition.value = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        }
      } else if (event.touches.length === 2) {
        isDragging.value = false
        initialTouchDistance.value = getTouchDistance(event.touches)
      }
    }

    const touchMove = (event) => {
      if (!myDiagram) return
      event.preventDefault()

      if (event.touches.length === 1 && isDragging.value) {
        const dx = (event.touches[0].clientX - lastTouchPosition.value.x) / myDiagram.scale
        const dy = (event.touches[0].clientY - lastTouchPosition.value.y) / myDiagram.scale

        const currentPos = myDiagram.position
        const newPos = new go.Point(
          currentPos.x - dx,
          currentPos.y - dy
        )
        
        startPanAnimation(newPos)

        lastTouchPosition.value = {
          x: event.touches[0].clientX,
          y: event.touches[0].clientY
        }
      } else if (event.touches.length === 2) {
        const newDistance = getTouchDistance(event.touches)
        const scale = newDistance / initialTouchDistance.value
        
        if (scale !== 1) {
          const newZoomLevel = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, currentZoom.value * scale))
          startZoomAnimation(newZoomLevel)
          initialTouchDistance.value = newDistance
        }
      }
    }

    const stopTouch = () => {
      isDragging.value = false
      initialTouchDistance.value = 0
    }

    const addChildNode = () => {
      if (!selectedNode.value || !myDiagram) return
      
      const newKey = myDiagram.model.nodeDataArray.length + 1
      const newNode = {
        key: newKey,
        name: "새 노드",
        parent: selectedNode.value.key,
        isSelected: false
      }
      
      myDiagram.startTransaction("add child node")
      myDiagram.model.addNodeData(newNode)
      myDiagram.commitTransaction("add child node")
    }
    
    const addSiblingNode = () => {
      if (!selectedNode.value || !myDiagram) return
      
      const parentNode = myDiagram.findNodeForKey(selectedNode.value.parent)
      const newKey = myDiagram.model.nodeDataArray.length + 1
      const newNode = {
        key: newKey,
        name: "새 노드",
        parent: parentNode ? selectedNode.value.parent : undefined,
        isSelected: false
      }
      
      myDiagram.startTransaction("add sibling node")
      myDiagram.model.addNodeData(newNode)
      myDiagram.commitTransaction("add sibling node")
    }

    const initDiagram = () => {
      const $ = go.GraphObject.make

      myDiagram = $(go.Diagram, diagramDiv.value, {
        initialContentAlignment: go.Spot.Center,
        "undoManager.isEnabled": true,
        allowMove: true,
        allowHorizontalScroll: true,
        allowVerticalScroll: true,
        scrollMode: go.Diagram.InfiniteScroll,
        layout: $(go.TreeLayout, {
          angle: 0,
          nodeSpacing: 50,
          layerSpacing: 50,
          arrangement: go.TreeLayout.ArrangementHorizontal,
          alignment: go.TreeLayout.AlignmentCenterChildren,
          compaction: go.TreeLayout.CompactionNone,
          layerStyle: go.TreeLayout.LayerUniform
        }),
        model: $(go.TreeModel),
        "animationManager.isEnabled": true,
        "animationManager.duration": ANIMATION_DURATION,
        scale: currentZoom.value
      })

      myDiagram.addDiagramListener("ObjectSingleClicked", (e) => {
        const part = e.subject.part
        if (part instanceof go.Node) {
          const node = part.data
          console.log("Selected Node:", node)
          selectedNode.value = node
        }
      })

      myDiagram.nodeTemplate = $(
        go.Node,
        "Spot",
        {
          selectionAdorned: false,
          resizable: false,
          layoutConditions: go.Part.LayoutStandard & ~go.Part.LayoutNodeSized,
          mouseDragEnter: (e, node) => {
            isNodeDragging.value = true
          },
          mouseDragLeave: (e, node) => {
            isNodeDragging.value = false
          },
        },
        new go.Binding("isSelected", "isSelected"),
        $(
          go.Panel,
          "Auto",
          {
            desiredSize: new go.Size(NaN, NaN),
            minSize: new go.Size(100, 40)
          },
          $(
            go.Shape,
            "RoundedRectangle",
            {
              fill: "white",
              strokeWidth: 3,
              stroke: "rgba(0, 0, 255, .15)",
              portId: "",
              fromSpot: go.Spot.RightSide,
              toSpot: go.Spot.LeftSide
            },
            new go.Binding("stroke", "isSelected", (s) => (s ? "blue" : "rgba(0, 0, 255, .15)")),
          ),
          $(
            go.TextBlock,
            {
              margin: 8,
              font: "14px sans-serif",
            },
            new go.Binding("text", "name"),
          )
        ),
        $(
          go.Panel,
          "Spot",
          {
            alignment: go.Spot.Right,
            alignmentFocus: go.Spot.Left,
            margin: new go.Margin(0, 0, 0, 15),
            desiredSize: new go.Size(25, 25),
            click: (e, obj) => {
              addSiblingNode()
              e.handled = true
            },
            cursor: "pointer"
          },
          new go.Binding("visible", "isSelected"),
          $(
            go.Shape,
            "Circle",
            {
              fill: "#00bfff",
              stroke: null,
              desiredSize: new go.Size(24, 24)  // width, height 대신 desiredSize 사용
            }
          ),
          $(
            go.TextBlock,
            "+",
            {
              font: "bold 16px sans-serif",
              stroke: "white",
              textAlign: "center",
              verticalAlignment: go.Spot.Center,
              alignmentFocus: go.Spot.Center
            }
          )
        ),
        $(
          go.Panel,
          "Spot",
          {
            alignment: go.Spot.Bottom,
            alignmentFocus: go.Spot.Top,
            margin: new go.Margin(15, 0, 0, 0),
            desiredSize: new go.Size(25, 25),
            click: (e, obj) => {
              addChildNode()
              e.handled = true
            },
            cursor: "pointer"
          },
          new go.Binding("visible", "isSelected"),
          $(
            go.Shape,
            "Circle",
            {
              fill: "#00bfff",
              stroke: null,
              desiredSize: new go.Size(24, 24),  // Circle 크기도 동일하게
              geometryStretch: go.GraphObject.Uniform  // 비율 유지를 위해 추가
            }
          ),
          $(
            go.TextBlock,
            "+",
            {
              font: "bold 16px sans-serif",
              stroke: "white",
              textAlign: "center",
              verticalAlignment: go.Spot.Center,
              alignmentFocus: go.Spot.Center
            }
          )
        )
      )

      myDiagram.linkTemplate =
        $(go.Link, {
          routing: go.Link.Orthogonal,
          corner: 5,
          adjusting: go.Link.None,
          fromEndSegmentLength: 1,
          toEndSegmentLength: 5
        },
          $(go.Shape, {
            strokeWidth: 2,
            stroke: "#555"
          })
        )

      const nodeDataArray = [
        { key: 1, name: "캡스톤 마인드맵 탐색", category: "Root", isSelected: false },
        { key: 2, name: "퍼블릭시트", parent: 1, isSelected: false },
        { key: 3, name: "글로벌", parent: 1, isSelected: false },
        { key: 4, name: "마인드맵 생성", parent: 1, isSelected: false },
        { key: 5, name: "출처 정보 제공", parent: 2, isSelected: false },
        { key: 6, name: "음성인식", parent: 3, isSelected: false },
        { key: 7, name: "노이즈 제거", parent: 3, isSelected: false },
        { key: 8, name: "이미지 LLM", parent: 4, isSelected: false },
        { key: 9, name: "마인드맵 생성 트직 구현", parent: 4, isSelected: false }
      ]

      myDiagram.model = new go.TreeModel(nodeDataArray)

      myDiagram.addDiagramListener("ChangedSelection", (e) => {
        const node = myDiagram.selection.first()
        
        myDiagram.model.nodeDataArray.forEach(n => {
          if (n.isSelected) {
            myDiagram.model.setDataProperty(n, "isSelected", false)
          }
        })
        
        if (node) {
          const data = node.data
          myDiagram.model.setDataProperty(data, "isSelected", true)
          selectedNode.value = data
        } else {
          selectedNode.value = null
        }
      })

      myDiagram.addDiagramListener("ViewportBoundsChanged", (e) => {
        currentZoom.value = myDiagram.scale
      })
    }

    onMounted(() => {
      initDiagram()
    })

    return {
      diagramDiv,
      currentZoom,
      selectedNode,
      increaseZoom,
      decreaseZoom,
      startDrag,
      stopDrag,
      dragMove,
      onWheel,
      startTouch,
      touchMove,
      stopTouch,
      deleteSelectedNode,
      addChildNode,
      addSiblingNode
    }
  }
}
</script>

<style scoped>
.mindmap-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #EAEAEA;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mindmap-container {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.mindmap-content {
  width: 100%;
  height: 100%;
  background-color: #FAFAFA;
}

.zoom-controls {
  position: fixed;
  left: 20px;
  bottom: 20px;
  background: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  gap: 8px;
  z-index: 9999;
  transition: all 0.3s ease;
}

.delete-control {
  position: fixed;
  right: 20px;
  bottom: 20px;
  background: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 9999;
  transition: all 0.3s ease;
}

.delete-btn {
  width: 90px;
  height: 32px;
  border: none;
  background: #d3d3d3;
  border-radius: 4px;
  cursor: not-allowed;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.delete-btn-enabled {
  background: #ff4444;
  color: white;
  cursor: pointer;
}

.delete-btn-enabled:hover {
  background: #ff0000;
}

.zoom-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: #f0f0f0;
  border-radius: 4px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 18px;
  font-weight: bold;
  transition: background-color 0.3s ease;
}

.zoom-btn:hover {
  background: #e0e0e0;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 16px;
  font-weight: 500;
}

.add-controls {
  position: fixed;
  right: 20px;
  top: 20px;
  background: white;
  padding: 5px;
  border-radius: 5px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  gap: 8px;
  z-index: 9999;
}

.add-btn {
  padding: 8px 16px;
  border: none;
  background: #4CAF50;
  color: white;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.3s ease;
}

.add-btn:hover {
  background: #45a049;
}
</style>

