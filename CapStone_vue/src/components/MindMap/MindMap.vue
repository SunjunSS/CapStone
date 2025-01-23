<template>
  <div 
    class="mindmap-wrapper" 
    :style="wrapperStyle" 
    @mousedown="startDrag" 
    @mouseup="stopDrag" 
    @mousemove="dragMove"
    @wheel="onWheel"
  >
    <div class="mindmap-container" :style="containerStyle">
      <!-- 마인드맵 -->
      <div class="mindmap-content" :style="contentStyle">
        <mindmap
          v-model="mindmapData"
          :edit="true"
          :add-node-btn="true"
          @node-click="handleNodeClick"
          @node-dblclick="handleNodeDblClick"
          class="vue3-mindmap"
        />
      </div>
    </div>
    <!-- 줌 컨트롤 -->
    <div class="zoom-controls">
      <button @click="decreaseZoom" class="zoom-btn">-</button>
      <span class="zoom-level">{{ zoomLevel }}%</span>
      <button @click="increaseZoom" class="zoom-btn">+</button>
    </div>
  </div>
</template>

<script>
import { ref, computed } from 'vue'
import mindmap from 'vue3-mindmap'
import 'vue3-mindmap/dist/style.css'

export default {
  components: { mindmap },
  setup() {
    const mindmapData = ref([{
      name: '캡스톤 마인드맵 탐색',
      children: [
        {
          name: '퍼블릭시트',
          children: [
            { name: '출처 정보 제공' }
          ]
        },
        {
          name: '글로벌',
          children: [
            { name: '음성인식' },
            { name: '노이즈 제거' }
          ]
        },
        {
          name: '마인드맵 생성',
          children: [
            { name: '이미지 LLM' },
            { name: '마인드맵 생성 트직 구현' }
          ]
        }
      ]
    }])

    const zoomLevel = ref(100)
    const MIN_ZOOM = 20
    const MAX_ZOOM = 200
    const ZOOM_STEP = 3
    const ZOOM_BUTTON_STEP = 20  // 버튼을 통한 확대/축소 비율

    // 마우스 위치와 화면 이동 추적
    const isDragging = ref(false)
    const startOffset = ref({ x: 0, y: 0 })
    const translate = ref({ x: 0, y: 0 })

    // 전체 래퍼 스타일
    const wrapperStyle = computed(() => ({
      backgroundColor: '#FAFAFA',  // 배경색 추가
      width: '100vw',
      height: '100vh',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }))

    // 마인드맵 콘텐츠 스타일 (확대/축소 및 이동 적용)
    const contentStyle = computed(() => ({
      transform: `scale(${zoomLevel.value / 100}) translate(${translate.value.x}px, ${translate.value.y}px)`,
      transformOrigin: 'center center',
      transition: isDragging.value ? 'transform 0.00001s ease-out' : 'transform 0.3s ease-out',
      userSelect: isDragging.value ? 'none' : 'auto' // 드래그 중에는 텍스트 선택 방지
    }))

    // 마인드맵 컨테이너 스타일
    const containerStyle = computed(() => ({
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
    }))

    // 확대 버튼 클릭 (5%씩 확대)
    const increaseZoom = () => {
      if (zoomLevel.value < MAX_ZOOM) {
        zoomLevel.value += ZOOM_BUTTON_STEP
      }
    }

    // 축소 버튼 클릭 (5%씩 축소)
    const decreaseZoom = () => {
      if (zoomLevel.value > MIN_ZOOM) {
        zoomLevel.value -= ZOOM_BUTTON_STEP
      }
    }

    // 마우스 드래그 시작
    const startDrag = (event) => {
      isDragging.value = true
      startOffset.value = { x: event.clientX, y: event.clientY }
    }

    // 마우스 드래그 종료
    const stopDrag = () => {
      isDragging.value = false
    }

    // 마우스 이동 시 화면 이동
    const dragMove = (event) => {
      if (isDragging.value) {
        const dx = event.clientX - startOffset.value.x
        const dy = event.clientY - startOffset.value.y
        translate.value = {
          x: translate.value.x + dx,
          y: translate.value.y + dy,
        }
        startOffset.value = { x: event.clientX, y: event.clientY }
      }
    }

    // 휠을 통한 줌 조정 (기존처럼 3%씩 확대/축소)
    const onWheel = (event) => {
      event.preventDefault();  // 기본 스크롤 동작 방지

      const zoomChange = event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP;
      const newZoomLevel = zoomLevel.value + zoomChange;

      if (newZoomLevel >= MIN_ZOOM && newZoomLevel <= MAX_ZOOM) {
        zoomLevel.value = newZoomLevel;
      }
    }

    const handleNodeClick = (node) => {
      console.log('Node clicked:', node)
    }

    const handleNodeDblClick = (node) => {
      console.log('Node double clicked:', node)
    }

    return {
      mindmapData,
      zoomLevel,
      wrapperStyle,
      contentStyle,
      containerStyle,
      increaseZoom,
      decreaseZoom,
      startDrag,
      stopDrag,
      dragMove,
      handleNodeClick,
      handleNodeDblClick,
      onWheel
    }
  }
}
</script>


<style scoped>
:deep(.Mindmap_svg_fgvb6) {
  background-color: transparent !important;
}

.mindmap-wrapper {
  position: fixed;
  top: 0;
  left: 0;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  background-color: #EAEAEA; /* 배경색을 여기에 설정 */
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
  position: relative;
  width: 100%;
  height: 100%;
  display: 'flex';
  justify-content: 'center';
  align-items: 'center';
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
}

.zoom-btn:hover {
  background: #e0e0e0;
}

.zoom-level {
  min-width: 50px;
  text-align: center;
  font-size: 16px;
  font-weight: bold;
}

:deep(.vue3-mindmap) {
  width: 100%;
  height: 100%;
}
</style>
