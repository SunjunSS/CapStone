--Drawing(그림판 타이틀 제거, 캔버스 영역 확대)--

<template>
  <div class="drawing-page">
    <div class="drawing-card">
      <!-- 툴바 좌우 분리 -->
      <div class="toolbar toolbar-justify">
        <!-- 왼쪽 툴바 그룹 -->
        <div class="toolbar-left">
          <div class="toolbar-group">
            <button
              @click="triggerImageUpload"
              :disabled="showColorPicker"
              :class="{
                active: mode === 'imageUpload',
                'image-upload': mode === 'imageUpload',
              }"
            >
              <i class="fas fa-image"></i>
              <span>업로드</span>
            </button>

            <button
              @click="downloadCanvas"
              :disabled="showColorPicker"
              :class="{
                active: mode === 'download',
                'download-button': true,
              }"
            >
              <i class="fas fa-download"></i>
              <span>저장</span>
            </button>

            <input
              type="file"
              ref="imageInput"
              accept="image/*"
              style="display: none"
              @change="handleImageUpload"
              :disabled="isUploadingImage"
            />
          </div>

          <div class="toolbar-group">
            <button
              @click="setMode('select')"
              :class="{ active: mode === 'select' }"
              :disabled="showColorPicker"
            >
              <i class="fas fa-mouse-pointer"></i>
              <span>선택</span>
            </button>

            <button
              @click="setMode('pencil')"
              :class="{ active: mode === 'pencil' }"
              :disabled="showColorPicker"
            >
              <i class="fas fa-pencil-alt"></i>
              <span>연필</span>
            </button>

            <button
              @click="setMode('line')"
              :class="{ active: mode === 'line' }"
              :disabled="showColorPicker"
            >
              <i class="fas fa-slash"></i>
              <span>직선</span>
            </button>

            <button
              @click="setMode('rect')"
              :class="{ active: mode === 'rect' }"
              :disabled="showColorPicker"
            >
              <i class="far fa-square"></i>
              <span>사각형</span>
            </button>

            <button
              @click="setMode('circle')"
              :class="{ active: mode === 'circle' }"
              :disabled="showColorPicker"
            >
              <i class="far fa-circle"></i>
              <span>원</span>
            </button>
          </div>

          <div class="toolbar-group">
            <button
              @click="deleteSelectedObjects"
              :disabled="showColorPicker || !isObjectSelected"
              :class="{ 'danger-action': isObjectSelected }"
            >
              <i class="fas fa-eraser"></i>
              <span>지우기</span>
            </button>

            <button
              @click="clearCanvas"
              :disabled="showColorPicker || !hasObjectsOnCanvas"
              :class="{ 'danger-action': hasObjectsOnCanvas }"
            >
              <i class="fas fa-trash-alt"></i>
              <span>모두 지우기</span>
            </button>
          </div>
        </div>

        <!-- 오른쪽 툴바 그룹 (px select) -->
        <div class="toolbar-right">
          <div class="toolbar-group">
            <select v-model="brushSize" :disabled="showColorPicker">
              <option value="1">1px</option>
              <option value="3">3px</option>
              <option value="5">5px</option>
              <option value="10">10px</option>
              <option value="15">15px</option>
              <option value="20">20px</option>
            </select>
          </div>
        </div>
      </div>

      <!-- 색상 팔레트 -->
      <div class="color-palette">
        <div class="color-grid">
          <div
            v-for="(colorValue, index) in basicColors"
            :key="'color-' + index"
            class="color-swatch"
            :style="{ backgroundColor: colorValue }"
            :class="{ active: color === colorValue }"
            @click="!showColorPicker && setColor(colorValue)"
          ></div>

          <div class="rainbow-selector" @click="openColorPicker">
            <div class="rainbow-icon">
              <i class="fas fa-plus"></i>
            </div>
          </div>
        </div>
      </div>

      <!-- 컬러 피커 모달 -->
      <div v-if="showColorPicker" class="color-picker-modal">
        <div class="color-picker-header">
          <h3>색 편집</h3>
          <button class="close-btn" @click="cancelColorPicker">
            <i class="fas fa-times"></i>
          </button>
        </div>

        <div class="color-picker-content">
          <div
            class="color-spectrum"
            ref="colorSpectrum"
            @click="pickColorFromSpectrum"
          >
            <div class="spectrum-gradient"></div>
          </div>

          <div class="color-preview-container">
            <div
              class="color-preview"
              :style="{ backgroundColor: tempColor }"
            ></div>
          </div>

          <div class="color-inputs">
            <div class="input-group">
              <label for="hexColor">HEX:</label>
              <input
                type="text"
                id="hexColor"
                v-model="hexColor"
                @change="updateColorFromHex"
              />
            </div>

            <div class="input-group">
              <label for="redValue">빨강:</label>
              <input
                type="number"
                id="redValue"
                v-model.number="rgbValues.r"
                min="0"
                max="255"
                @change="updateColorFromRgb"
              />
            </div>

            <div class="input-group">
              <label for="greenValue">녹색:</label>
              <input
                type="number"
                id="greenValue"
                v-model.number="rgbValues.g"
                min="0"
                max="255"
                @change="updateColorFromRgb"
              />
            </div>

            <div class="input-group">
              <label for="blueValue">파랑:</label>
              <input
                type="number"
                id="blueValue"
                v-model.number="rgbValues.b"
                min="0"
                max="255"
                @change="updateColorFromRgb"
              />
            </div>
          </div>

          <div class="color-picker-buttons">
            <button @click="applyColor">
              <span>확인</span>
            </button>
            <button @click="cancelColorPicker">
              <span>취소</span>
            </button>
          </div>
        </div>
      </div>

      <!-- 캔버스 -->
      <div class="canvas-container">
        <canvas ref="canvas"></canvas>
      </div>
    </div>
  </div>
</template>

<script>
// 올바른 import 구문
import * as fabric from "fabric";

export default {
  name: "DrawingApp",
  data() {
    return {
      canvas: null,
      mode: "select",
      color: "#990000", // 초기 색상을 붉은색으로 설정
      tempColor: "#990000", // 컬러 피커에서 임시로 선택한 색상
      hexColor: "#990000", // HEX 입력용
      rgbValues: { r: 153, g: 0, b: 0 }, // RGB 입력용
      brushSize: 5,
      isDrawing: false,
      startPoint: null,
      currentObject: null,
      showColorPicker: false,
      lastSelectedObject: null,
      isUploadingImage: false,
      isObjectSelected: false,
      hasObjectsOnCanvas: false,

      // 기본 색상들 (이미지와 유사하게 조정)
      basicColors: [
        "#000000", // 검정
        "#7F7F7F", // 회색
        "#880015", // 어두운 빨강
        "#ED1C24", // 빨강
        "#FF7F27", // 주황
        "#FFF200", // 노랑
        "#22B14C", // 초록
        "#00A2E8", // 파랑
        "#3F48CC", // 진한 파랑
        "#A349A4", // 보라
        "#FFFFFF", // 흰색
        "#C3C3C3", // 연한 회색
        "#B97A57", // 갈색
        "#FFAEC9", // 분홍
        "#FFFF88", // 연한 노랑
        "#B5E61D", // 연한 초록
        "#99D9EA", // 연한 하늘색
        "#7092BE", // 연한 파랑
        "#C8BFE7", // 연한 보라
      ],
    };
  },
  mounted() {
    // 컴포넌트가 마운트되면 캔버스 초기화 및 윈도우 리사이즈 이벤트 추가
    this.initCanvas();
    window.addEventListener("resize", this.resizeCanvas);

    document.addEventListener("keydown", this.handleKeyDown);
    document.addEventListener("keyup", this.handleKeyUp);

    // 여기에 클립보드 붙여넣기 이벤트 리스너 추가
    document.addEventListener("paste", this.handlePaste);

    // ✅ 선택 상태 변경 감지
    this.$nextTick(() => {
      this.canvas.on("selection:created", this.updateSelectionState);
      this.canvas.on("selection:updated", this.updateSelectionState);
      this.canvas.on("selection:cleared", this.updateSelectionState);

      // ✅ 캔버스 오브젝트 변경 감지
      this.canvas.on("object:added", this.updateCanvasObjectState);
      this.canvas.on("object:removed", this.updateCanvasObjectState);

      // 🧱 경계 제한 이벤트 추가
      this.canvas.on("object:moving", function (e) {
        const obj = e.target;
        const objWidth = obj.getScaledWidth();
        const objHeight = obj.getScaledHeight();
        const canvasWidth = obj.canvas.getWidth();
        const canvasHeight = obj.canvas.getHeight();

        if (obj.left < 0) obj.left = 0;
        if (obj.left + objWidth > canvasWidth)
          obj.left = canvasWidth - objWidth;

        if (obj.top < 0) obj.top = 0;
        if (obj.top + objHeight > canvasHeight)
          obj.top = canvasHeight - objHeight;
      });

      this.canvas.on("object:scaling", function (e) {
        const obj = e.target;

        const objWidth = obj.getScaledWidth();
        const objHeight = obj.getScaledHeight();

        const canvasWidth = obj.canvas.getWidth();
        const canvasHeight = obj.canvas.getHeight();

        // X축 제한
        if (obj.left < 0) obj.left = 0;
        if (obj.left + objWidth > canvasWidth)
          obj.scaleX = (canvasWidth - obj.left) / obj.width;

        // Y축 제한
        if (obj.top < 0) obj.top = 0;
        if (obj.top + objHeight > canvasHeight)
          obj.scaleY = (canvasHeight - obj.top) / obj.height;
      });
    });
  },
  beforeDestroy() {
    // 🔹 전역 이벤트 제거
    window.removeEventListener("resize", this.resizeCanvas);
    document.removeEventListener("keydown", this.handleKeyDown);
    document.removeEventListener("keyup", this.handleKeyUp);
    document.removeEventListener("paste", this.handlePaste);

    if (this.canvas) {
      // 🔹 마우스 이벤트 제거
      this.canvas.off("mouse:down", this.onMouseDown);
      this.canvas.off("mouse:move", this.onMouseMove);
      this.canvas.off("mouse:up", this.onMouseUp);

      // 🔹 선택 이벤트 제거
      this.canvas.off("selection:created", this.updateSelectionState);
      this.canvas.off("selection:updated", this.updateSelectionState);
      this.canvas.off("selection:cleared", this.updateSelectionState);

      // 🔹 오브젝트 상태 변화 이벤트 제거
      this.canvas.off("object:added", this.updateCanvasObjectState);
      this.canvas.off("object:removed", this.updateCanvasObjectState);

      // 🔹 캔버스 해제
      this.canvas.dispose();
    }
  },
  methods: {
    initCanvas() {
      console.log("Initializing canvas...");
      console.log("Fabric object:", fabric);

      try {
        const canvasContainer = document.querySelector(".canvas-container");
        const containerWidth = canvasContainer.clientWidth;

        const toolbarHeight =
          document.querySelector(".toolbar")?.offsetHeight || 0;
        const paletteHeight = 100; // 색상 팔레트 높이 (필요하면 조정)

        // 🔹 headerHeight 제거 후 바로 계산 가능
        const totalHeaderHeight = toolbarHeight + paletteHeight + 40; // 마진 추가
        const containerHeight = window.innerHeight - totalHeaderHeight;

        this.canvas = new fabric.Canvas(this.$refs.canvas, {
          isDrawingMode: false, // true에서 false로 변경 (선택 모드 활성화)
          backgroundColor: "#ffffff",
          width: containerWidth,
          height: containerHeight,
          selection: false,
          skipTargetFind: false,
          selectionColor: "transparent",
          selectionBorderColor: "transparent",
          selectionLineWidth: 0,
          selectionDashArray: [],
          selectionFullyContained: false,
        });

        this.canvas.skipTargetFind = false;

        console.log("Canvas created:", this.canvas);

        if (!this.canvas.freeDrawingBrush) {
          console.log("Creating PencilBrush...");
          this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        }

        this.canvas.freeDrawingBrush.color = this.color;
        this.canvas.freeDrawingBrush.width = parseInt(this.brushSize, 10);

        this.canvas.on("mouse:down", this.onMouseDown);
        this.canvas.on("mouse:move", this.onMouseMove);
        this.canvas.on("mouse:up", this.onMouseUp);

        // 선택 모드 초기화 설정 추가
        this.setMode("select");

        console.log("Canvas initialization complete");
      } catch (error) {
        console.error("Error initializing canvas:", error);
      }
    },

    resizeCanvas() {
      if (!this.canvas) return; // 🔹 캔버스가 없으면 실행하지 않음

      // 현재 캔버스 내용을 저장
      const json = this.canvas.toJSON();

      // 캔버스 컨테이너의 새 크기 가져오기
      const canvasContainer = document.querySelector(".canvas-container");
      const containerWidth = canvasContainer
        ? canvasContainer.clientWidth
        : window.innerWidth;

      // 툴바 높이 가져오기 (존재하지 않으면 0)
      const toolbarHeight =
        document.querySelector(".toolbar")?.offsetHeight || 0;
      const paletteHeight = 100; // 색상 팔레트의 대략적인 높이
      const totalHeaderHeight = toolbarHeight + paletteHeight + 40; // 마진과 패딩 추가

      // 뷰포트의 남은 공간을 계산하여 캔버스 높이 설정
      const containerHeight = window.innerHeight - totalHeaderHeight;

      // 캔버스 크기 설정
      this.canvas.setWidth(containerWidth);
      this.canvas.setHeight(containerHeight);

      // 저장된 내용 복원
      this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas));
    },

    // setMode 메소드 수정
    setMode(mode) {
      this.mode = mode;
      if (this.canvas) {
        this.canvas.isDrawingMode = mode === "pencil";

        const isSelectable = mode === "select";

        // 🔹 중요: 기본적으로 드래그 선택은 비활성화
        this.canvas.selection = false;

        // 개별 객체의 선택 기능 설정
        this.canvas.forEachObject((obj) => {
          obj.selectable = isSelectable;
          obj.evented = isSelectable;
          obj.hasBorders = isSelectable;
          obj.hasControls = isSelectable;
        });

        if (!isSelectable) {
          this.canvas.discardActiveObject();
          this.lastSelectedObject = null;
        }

        this.canvas.defaultCursor = isSelectable ? "default" : "crosshair";
        this.canvas.hoverCursor = isSelectable ? "move" : "crosshair";
        this.canvas.requestRenderAll();
      }
    },

    setColor(newColor) {
      this.color = newColor;
      this.updateHexAndRgb(newColor);
      if (this.canvas && this.canvas.freeDrawingBrush) {
        this.canvas.freeDrawingBrush.color = newColor;
      }
    },

    updateSliderBackground() {
      if (!this.$refs.sliderTrack) return;

      // 현재 HSL 값 구하기
      const hsl = this.rgbToHsl(
        this.rgbValues.r,
        this.rgbValues.g,
        this.rgbValues.b
      );
      const hue = hsl[0];

      // 색상(hue)만 유지하고 채도는 최대로, 명도는 100%~0% 그라데이션 설정 (방향 반대로)
      this.$refs.sliderTrack.style.background = `linear-gradient(to right,
      hsl(${hue * 360}, 100%, 100%),
      hsl(${hue * 360}, 100%, 50%),
      hsl(${hue * 360}, 100%, 0%))`;
    },

    openColorPicker() {
      // 그리기 중이라면 취소
      this.isDrawing = false;

      // 현재 객체가 있다면 제거
      if (this.currentObject) {
        this.canvas.remove(this.currentObject);
        this.currentObject = null;
      }

      // 캔버스 그리기 모드 비활성화 (바로 적용)
      if (this.canvas) {
        this._previousDrawingMode = this.canvas.isDrawingMode;
        this.canvas.isDrawingMode = false;
      }

      // 기존 코드 유지
      this.tempColor = this.color;
      this.updateHexAndRgb(this.color);
      this.showColorPicker = true;
    },

    cancelColorPicker() {
      this.showColorPicker = false;
      this.tempColor = this.color;

      // 이전 그리기 모드 복원
      if (this.canvas) {
        if (this.mode === "pencil") {
          this.canvas.isDrawingMode = true;
        } else {
          this.canvas.isDrawingMode = false;
        }
      }
    },

    // HEX 값으로부터 RGB 값 계산
    updateHexAndRgb(hex) {
      this.hexColor = hex;
      // HEX를 RGB로 변환
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      if (result) {
        this.rgbValues = {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        };
      }
    },

    // RGB 값으로부터 HEX 값 계산
    updateColorFromRgb() {
      // RGB 값이 범위를 넘지 않도록 조정
      this.rgbValues.r = Math.min(255, Math.max(0, this.rgbValues.r || 0));
      this.rgbValues.g = Math.min(255, Math.max(0, this.rgbValues.g || 0));
      this.rgbValues.b = Math.min(255, Math.max(0, this.rgbValues.b || 0));

      // RGB를 HEX로 변환
      const r = Math.round(this.rgbValues.r).toString(16).padStart(2, "0");
      const g = Math.round(this.rgbValues.g).toString(16).padStart(2, "0");
      const b = Math.round(this.rgbValues.b).toString(16).padStart(2, "0");

      this.hexColor = `#${r}${g}${b}`.toUpperCase();
      this.tempColor = this.hexColor;
    },

    // HEX 값이 변경되었을 때 RGB 값 업데이트
    updateColorFromHex() {
      // 기존 코드 유지
      const isValidHex = /^#?([a-f\d]{6})$/i.test(this.hexColor);

      if (isValidHex) {
        if (!this.hexColor.startsWith("#")) {
          this.hexColor = "#" + this.hexColor;
        }

        this.updateHexAndRgb(this.hexColor);
        this.tempColor = this.hexColor;
      }
    },

    // 스펙트럼에서 색상 선택
    pickColorFromSpectrum(event) {
      if (!this.$refs.colorSpectrum) return;

      const rect = this.$refs.colorSpectrum.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;

      // 여기서는 간단히 위치에 따라 색상을 생성
      const h = Math.floor((x / rect.width) * 360);
      const s = Math.floor((y / rect.height) * 100);

      // HSL에서 RGB로 변환
      const rgb = this.hslToRgb(h / 360, s / 100, 0.5);
      this.rgbValues = { r: rgb[0], g: rgb[1], b: rgb[2] };
      this.updateColorFromRgb();

      // 명시적으로 tempColor 업데이트
      this.tempColor = this.hexColor;
    },

    // 슬라이더에서 색상 선택
    pickColorFromSlider(event) {
      if (!this.$refs.sliderTrack) return;

      const rect = this.$refs.sliderTrack.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const percentage = x / rect.width;

      // 현재 HSL 값 가져오기
      const hsl = this.rgbToHsl(
        this.rgbValues.r,
        this.rgbValues.g,
        this.rgbValues.b
      );

      // 명도(lightness)만 변경
      const l = 1 - percentage; // 1~0 사이 값 (오른쪽이 0에 가까워지도록)

      // 더 명확한 HSL -> RGB 변환 과정
      const rgb = this.hslToRgb(hsl[0], hsl[1], l);

      // RGB 값 직접 설정
      this.rgbValues = {
        r: Math.round(rgb[0]),
        g: Math.round(rgb[1]),
        b: Math.round(rgb[2]),
      };

      // RGB -> HEX 변환 (직접 구현)
      const r = this.rgbValues.r.toString(16).padStart(2, "0");
      const g = this.rgbValues.g.toString(16).padStart(2, "0");
      const b = this.rgbValues.b.toString(16).padStart(2, "0");
      this.hexColor = `#${r}${g}${b}`.toUpperCase();

      // 미리보기를 위해 명시적으로 tempColor 업데이트
      this.tempColor = this.hexColor;

      // 컴포넌트 업데이트 강제
      this.$forceUpdate();
    },

    // 색상 적용
    applyColor() {
      this.color = this.tempColor;
      if (this.canvas && this.canvas.freeDrawingBrush) {
        this.canvas.freeDrawingBrush.color = this.color;
      }
      this.showColorPicker = false;

      // 이전 그리기 모드 복원
      if (this.canvas) {
        if (this.mode === "pencil") {
          this.canvas.isDrawingMode = true;
        } else {
          this.canvas.isDrawingMode = false;
        }
      }
    },

    // HSL -> RGB 변환 (간단한 구현)
    hslToRgb(h, s, l) {
      let r, g, b;

      if (s === 0) {
        r = g = b = l; // 회색
      } else {
        const hue2rgb = (p, q, t) => {
          if (t < 0) t += 1;
          if (t > 1) t -= 1;
          if (t < 1 / 6) return p + (q - p) * 6 * t;
          if (t < 1 / 2) return q;
          if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
          return p;
        };

        const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        const p = 2 * l - q;

        r = hue2rgb(p, q, h + 1 / 3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1 / 3);
      }

      return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    },

    // RGB -> HSL 변환 (간단한 구현)
    rgbToHsl(r, g, b) {
      r /= 255;
      g /= 255;
      b /= 255;

      const max = Math.max(r, g, b);
      const min = Math.min(r, g, b);
      let h,
        s,
        l = (max + min) / 2;

      if (max === min) {
        h = s = 0; // 회색
      } else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);

        switch (max) {
          case r:
            h = (g - b) / d + (g < b ? 6 : 0);
            break;
          case g:
            h = (b - r) / d + 2;
            break;
          case b:
            h = (r - g) / d + 4;
            break;
        }

        h /= 6;
      }

      return [h, s, l];
    },

    clearCanvas() {
      if (this.canvas) {
        this.canvas.clear();
        this.canvas.backgroundColor = "#ffffff";
        this.canvas.renderAll();
        this.updateCanvasObjectState(); // ✅ 수동으로 상태 갱신
      }
    },

    deleteSelectedObjects() {
      if (!this.canvas || this.showColorPicker) return;

      const activeObjects = this.canvas.getActiveObjects();
      if (!activeObjects || activeObjects.length === 0) return;

      // Delete 키 처리와 동일한 로직 사용
      // 삭제 전 객체 정보 저장
      const objectsToDelete = activeObjects.map((obj) => ({
        type: obj.type,
        isImage: obj.type === "image" || obj.isImage,
        isCurrentObject: obj === this.currentObject,
        isLastSelected: obj === this.lastSelectedObject,
      }));

      // 이미지 객체가 포함되어 있는지 확인
      const containsImage = objectsToDelete.some((obj) => obj.isImage);

      // 삭제 전 남은 객체 배열 저장
      const allObjects = [...this.canvas.getObjects()];

      // 현재 선택된 객체들의 인덱스 찾기
      const selectedObjectIndices = activeObjects.map((activeObj) =>
        allObjects.findIndex((obj) => obj === activeObj)
      );

      // 최소 인덱스 찾기 (여러 객체 중 가장 먼저 추가된 객체의 위치)
      const minSelectedIndex = Math.min(...selectedObjectIndices);

      // 선택된 각 객체 제거
      activeObjects.forEach((obj) => {
        this.canvas.remove(obj);
      });

      // 선택 그룹 초기화
      this.canvas.discardActiveObject();
      this.canvas.renderAll();

      // 객체가 삭제된 후 남은 객체들 확인
      const remainingObjects = this.canvas.getObjects();

      // 객체가 남아있고 이미지 객체가 포함되어 있었다면 추가 삭제 시도
      if (remainingObjects.length > 0 && containsImage) {
        // 다음 객체 선택 (가능하면 같은 위치의 객체, 없으면 마지막 객체)
        let nextObjectIndex = minSelectedIndex;

        // 같은 인덱스에 객체가 없으면 인덱스 조정
        if (nextObjectIndex >= remainingObjects.length) {
          nextObjectIndex = remainingObjects.length - 1;
        }

        // 다음 삭제할 객체
        const nextObjects = [];

        // 다중 선택 삭제 후 동일한 수의 객체를 삭제하려고 시도
        // 단, 남은 객체 수를 초과하지 않도록 함
        const objectsToSelectCount = Math.min(
          objectsToDelete.length,
          remainingObjects.length
        );

        for (let i = 0; i < objectsToSelectCount; i++) {
          let indexToSelect = nextObjectIndex + i;

          // 인덱스가 범위를 벗어나면 처음부터 다시 시작
          if (indexToSelect >= remainingObjects.length) {
            indexToSelect = indexToSelect - remainingObjects.length;
          }

          nextObjects.push(remainingObjects[indexToSelect]);
        }

        if (nextObjects.length > 0) {
          // 단일 객체 선택
          if (nextObjects.length === 1) {
            this.canvas.setActiveObject(nextObjects[0]);
          } else {
            // 다중 객체 선택
            const activeSelection = new fabric.ActiveSelection(nextObjects, {
              canvas: this.canvas,
            });
            this.canvas.setActiveObject(activeSelection);
          }

          this.canvas.renderAll();

          // 선택된 객체들 즉시 삭제
          nextObjects.forEach((obj) => {
            this.canvas.remove(obj);
          });

          this.canvas.discardActiveObject();
          this.canvas.renderAll();
        }
      }

      this.isObjectSelected = false;
      this.updateCanvasObjectState();
    },

    updateCanvasObjectState() {
      this.hasObjectsOnCanvas =
        this.canvas && this.canvas.getObjects().length > 0;
    },

    updateSelectionState() {
      const active = this.canvas.getActiveObjects();
      this.isObjectSelected = active && active.length > 0;
    },

    downloadCanvas() {
      if (!this.canvas) return;

      // 🔹 1. 먼저 다운로드 모드로 설정하여 버튼에 active 클래스 적용
      this.setMode("download");

      // 🔹 2. 브라우저가 버튼 스타일 렌더링할 수 있도록 타이밍 확보
      requestAnimationFrame(() => {
        // 🔹 3. 다시 한 번 requestAnimationFrame으로 다음 프레임까지 기다림
        requestAnimationFrame(() => {
          const dataURL = this.canvas.toDataURL({
            format: "png",
            multiplier: 1,
            enableRetinaScaling: false,
            quality: 1,
            backgroundColor: "#ffffff",
          });

          const link = document.createElement("a");
          const now = new Date();
          const formatted = `${now.getFullYear()}.${String(
            now.getMonth() + 1
          ).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}-canvas`;

          link.href = dataURL;
          link.download = `${formatted}.png`;
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // 🔹 4. 다운로드가 끝났다고 가정하고 약간의 지연 후 select 모드로 복귀
          setTimeout(() => {
            this.setMode("select");
          }, 200); // 100~200ms 사이로 적절히 조정 가능
        });
      });
    },

    onMouseDown(o) {
      if (this.mode === "pencil" || !this.canvas || this.showColorPicker)
        return;

      this.isDrawing = true;
      const pointer = this.canvas.getPointer(o.e);
      this.startPoint = { x: pointer.x, y: pointer.y };

      // 선택 모드 여부에 따라 설정
      const isSelectable = this.mode === "select";

      if (this.mode === "line") {
        this.currentObject = new fabric.Line(
          [
            this.startPoint.x,
            this.startPoint.y,
            this.startPoint.x,
            this.startPoint.y,
          ],
          {
            stroke: this.color,
            strokeWidth: parseInt(this.brushSize, 10),
            // 현재 모드에 따라 설정
            selectable: isSelectable,
            evented: isSelectable,
            hasBorders: isSelectable,
            hasControls: isSelectable,
            hoverCursor: "pointer",
          }
        );
      } else if (this.mode === "rect") {
        this.currentObject = new fabric.Rect({
          left: this.startPoint.x,
          top: this.startPoint.y,
          width: 0,
          height: 0,
          fill: "transparent",
          stroke: this.color,
          strokeWidth: parseInt(this.brushSize, 10),
          // 현재 모드에 따라 설정
          selectable: isSelectable,
          evented: isSelectable,
          hasBorders: isSelectable,
          hasControls: isSelectable,
          hoverCursor: "pointer",
        });
      } else if (this.mode === "circle") {
        this.currentObject = new fabric.Circle({
          left: this.startPoint.x,
          top: this.startPoint.y,
          radius: 0,
          fill: "transparent",
          stroke: this.color,
          strokeWidth: parseInt(this.brushSize, 10),
          // 현재 모드에 따라 설정
          selectable: isSelectable,
          evented: isSelectable,
          hasBorders: isSelectable,
          hasControls: isSelectable,
          hoverCursor: "pointer",
        });
      }

      if (this.currentObject) {
        this.canvas.add(this.currentObject);
      }
    },

    onMouseMove(o) {
      if (
        !this.isDrawing ||
        !this.canvas ||
        !this.currentObject ||
        this.showColorPicker
      )
        return;

      const pointer = this.canvas.getPointer(o.e);

      if (this.mode === "line") {
        this.currentObject.set({
          x2: pointer.x,
          y2: pointer.y,
        });
      } else if (this.mode === "rect") {
        const width = Math.abs(pointer.x - this.startPoint.x);
        const height = Math.abs(pointer.y - this.startPoint.y);
        const left =
          pointer.x < this.startPoint.x ? pointer.x : this.startPoint.x;
        const top =
          pointer.y < this.startPoint.y ? pointer.y : this.startPoint.y;

        this.currentObject.set({
          left: left,
          top: top,
          width: width,
          height: height,
        });
      } else if (this.mode === "circle") {
        const radius =
          Math.sqrt(
            Math.pow(pointer.x - this.startPoint.x, 2) +
              Math.pow(pointer.y - this.startPoint.y, 2)
          ) / 2;

        const centerX = (pointer.x + this.startPoint.x) / 2;
        const centerY = (pointer.y + this.startPoint.y) / 2;

        this.currentObject.set({
          left: centerX - radius,
          top: centerY - radius,
          radius: radius,
        });
      }

      this.canvas.renderAll();
    },

    onMouseUp() {
      if (this.showColorPicker) return;
      this.isDrawing = false;

      // 객체가 방금 생성됐다면
      if (this.currentObject) {
        // 선택 모드일 때만 객체 선택 가능하게
        const isSelectable = this.mode === "select";
        this.currentObject.set({
          selectable: isSelectable,
          evented: isSelectable,
          hasBorders: isSelectable,
          hasControls: isSelectable,
          lockScalingX: false,
          lockScalingY: false,
          lockRotation: false,
        });

        // 선택 모드라면 현재 객체를 활성 객체로 설정
        if (isSelectable) {
          this.canvas.setActiveObject(this.currentObject);
          this.lastSelectedObject = this.currentObject;
        }

        this.currentObject.setCoords();
        this.canvas.requestRenderAll();
        this.currentObject = null;
      } else {
        // 객체를 선택하는 경우 (드래그 아닌 경우)
        const activeObject = this.canvas.getActiveObject();
        if (activeObject && this.mode === "select") {
          this.lastSelectedObject = activeObject;
        }
      }
    },

    // handleKeyDown 메소드를 수정합니다
    handleKeyDown(event) {
      // Delete 키가 눌렸을 때 (Delete 키 코드는 46)
      if (event.keyCode === 46 || event.key === "Delete") {
        // 컬러 피커가 열려있지 않고, 선택 모드일 때만 작동
        if (!this.showColorPicker && this.mode === "select") {
          // 다중 선택된 객체들 확인
          const activeObjects = this.canvas.getActiveObjects();

          if (activeObjects && activeObjects.length > 0) {
            // 삭제 전 객체 정보 저장
            const objectsToDelete = activeObjects.map((obj) => ({
              type: obj.type,
              isImage: obj.type === "image" || obj.isImage,
              isCurrentObject: obj === this.currentObject,
              isLastSelected: obj === this.lastSelectedObject,
            }));

            console.log("삭제 전 객체:", objectsToDelete);

            // 이미지 객체가 포함되어 있는지 확인
            const containsImage = objectsToDelete.some((obj) => obj.isImage);

            // 삭제 전 남은 객체 배열 저장
            const allObjects = [...this.canvas.getObjects()];

            // 현재 선택된 객체들의 인덱스 찾기
            const selectedObjectIndices = activeObjects.map((activeObj) =>
              allObjects.findIndex((obj) => obj === activeObj)
            );

            // 최소 인덱스 찾기 (여러 객체 중 가장 먼저 추가된 객체의 위치)
            const minSelectedIndex = Math.min(...selectedObjectIndices);

            // 선택된 각 객체 제거
            activeObjects.forEach((obj) => {
              this.canvas.remove(obj);
            });

            // 선택 그룹 초기화
            this.canvas.discardActiveObject();
            this.canvas.renderAll();

            // 객체가 삭제된 후 남은 객체들 확인
            const remainingObjects = this.canvas.getObjects();
            console.log("남은 객체 수:", remainingObjects.length);

            // 객체가 남아있고 이미지 객체가 포함되어 있었다면 추가 삭제 시도
            if (remainingObjects.length > 0 && containsImage) {
              // 다음 객체 선택 (가능하면 같은 위치의 객체, 없으면 마지막 객체)
              let nextObjectIndex = minSelectedIndex;

              // 같은 인덱스에 객체가 없으면 인덱스 조정
              if (nextObjectIndex >= remainingObjects.length) {
                nextObjectIndex = remainingObjects.length - 1;
              }

              // 다음 삭제할 객체
              const nextObjects = [];

              // 다중 선택 삭제 후 동일한 수의 객체를 삭제하려고 시도
              // 단, 남은 객체 수를 초과하지 않도록 함
              const objectsToSelectCount = Math.min(
                objectsToDelete.length,
                remainingObjects.length
              );

              for (let i = 0; i < objectsToSelectCount; i++) {
                let indexToSelect = nextObjectIndex + i;

                // 인덱스가 범위를 벗어나면 처음부터 다시 시작
                if (indexToSelect >= remainingObjects.length) {
                  indexToSelect = indexToSelect - remainingObjects.length;
                }

                nextObjects.push(remainingObjects[indexToSelect]);
              }

              if (nextObjects.length > 0) {
                console.log("다음 객체 자동 선택:", nextObjects.length, "개");

                if (nextObjects.length === 1) {
                  // 단일 객체 선택
                  this.canvas.setActiveObject(nextObjects[0]);
                } else {
                  // 다중 객체 선택
                  const activeSelection = new fabric.ActiveSelection(
                    nextObjects,
                    {
                      canvas: this.canvas,
                    }
                  );
                  this.canvas.setActiveObject(activeSelection);
                }

                this.canvas.renderAll();

                // 선택된 객체들 즉시 삭제
                nextObjects.forEach((obj) => {
                  this.canvas.remove(obj);
                });

                this.canvas.discardActiveObject();
                this.canvas.renderAll();

                console.log(
                  "자동 삭제 완료, 남은 객체 수:",
                  this.canvas.getObjects().length
                );
              }
            }
          }
        }
      }

      // 's' 키가 눌렸을 때 선택 모드로 전환
      if (event.key === "s" || event.key === "S") {
        // 컬러 피커가 열려있지 않을 때만 작동
        if (!this.showColorPicker) {
          this.setMode("select");
        }
      }

      // Shift 키가 눌렸을 때 (선택 모드에서만)
      if (
        event.key === "Shift" &&
        this.mode === "select" &&
        !this.showColorPicker
      ) {
        // Shift 키 누르면 다중 선택 활성화
        if (this.canvas) {
          this.canvas.selection = true; // 드래그 선택 활성화
        }
      }
    },

    handleKeyUp(event) {
      // Shift 키가 떼어졌을 때
      if (
        event.key === "Shift" &&
        this.mode === "select" &&
        !this.showColorPicker
      ) {
        // Shift 키 떼면 드래그 선택 다시 비활성화
        if (this.canvas) {
          this.canvas.selection = false;
        }
      }
    },

    // 이미지 업로드 input 트리거
    triggerImageUpload() {
      this.setMode("imageUpload");
      this.$refs.imageInput.click();
    },

    handleImageUpload(e) {
      const file = e.target.files[0];
      if (!file || this.isUploadingImage) return; // 🔒 업로드 중이면 무시

      this.isUploadingImage = true; // 🔒 업로드 중 상태로 설정

      const reader = new FileReader();
      reader.onload = (event) => {
        const imgObj = new Image();
        imgObj.src = event.target.result;

        imgObj.onload = () => {
          // 렌더링 안정화를 위해 약간의 딜레이를 줌
          setTimeout(() => {
            this.setMode("select"); // 선택 모드로 전환

            const margin = 30;
            const maxWidth = this.canvas.getWidth();
            const maxHeight = this.canvas.getHeight();
            const availableWidth = maxWidth - 2 * margin;
            const availableHeight = maxHeight - 2 * margin;

            const imgWidth = imgObj.width;
            const imgHeight = imgObj.height;

            const scaleX = availableWidth / imgWidth;
            const scaleY = availableHeight / imgHeight;
            const scale = Math.min(scaleX, scaleY, 1); // 확대 방지

            const image = new fabric.Image(imgObj, {
              left: (maxWidth - imgWidth * scale) / 2,
              top: (maxHeight - imgHeight * scale) / 2,
              scaleX: scale,
              scaleY: scale,
              selectable: true,
              evented: true,
              hasBorders: true,
              hasControls: true,
              lockScalingX: false,
              lockScalingY: false,
              lockRotation: false,
            });

            this.canvas.add(image);
            this.canvas.setActiveObject(image);
            this.currentObject = image;
            this.canvas.requestRenderAll();

            // 마우스 클릭 이벤트 시뮬레이션
            const canvasEl = this.canvas.upperCanvasEl;
            const clientX = image.left + 10;
            const clientY = image.top + 10;

            canvasEl.dispatchEvent(
              new MouseEvent("mousedown", {
                bubbles: true,
                cancelable: true,
                clientX,
                clientY,
              })
            );
            canvasEl.dispatchEvent(
              new MouseEvent("mouseup", {
                bubbles: true,
                cancelable: true,
                clientX,
                clientY,
              })
            );

            console.log(
              "Image added with scale and margin-centered position, click simulated:",
              image
            );

            this.isUploadingImage = false; // 🔓 업로드 완료 후 입력 허용
          }, 500); // 💡 렌더링 안정화를 위한 100ms 지연
        };
      };

      reader.readAsDataURL(file);
      e.target.value = ""; // input 초기화 (같은 파일 다시 선택 가능)
    },

    handlePaste(e) {
      if (e.clipboardData && e.clipboardData.items) {
        for (let i = 0; i < e.clipboardData.items.length; i++) {
          const item = e.clipboardData.items[i];

          if (item.type.indexOf("image") !== -1) {
            const blob = item.getAsFile();
            const reader = new FileReader();

            reader.onload = (event) => {
              const imgObj = new Image();
              imgObj.src = event.target.result;

              imgObj.onload = () => {
                this.setMode("select"); // 🔹 자동으로 선택 모드 변경

                const image = new fabric.Image(imgObj, {
                  left: 50,
                  top: 50,
                  scaleX: 0.5,
                  scaleY: 0.5,
                  selectable: true, // 🔹 클릭으로 선택 가능
                  evented: true, // 🔹 클릭 이벤트 활성화
                  hasBorders: true,
                  hasControls: true,
                  lockScalingX: false,
                  lockScalingY: false,
                  lockRotation: false,
                });

                this.canvas.add(image);
                this.canvas.setActiveObject(image); // 🔹 이미지 자동 선택
                this.currentObject = image; // 현재 객체 저장
                this.canvas.requestRenderAll();

                // 🔹 시간 간격 없이 즉시 마우스 이벤트 발생
                const canvasEl = this.canvas.upperCanvasEl;

                // 🔹 마우스 다운 이벤트 즉시 발생
                canvasEl.dispatchEvent(
                  new MouseEvent("mousedown", {
                    bubbles: true,
                    cancelable: true,
                    clientX: image.left + 10,
                    clientY: image.top + 10,
                  })
                );

                // 🔹 마우스 업 이벤트 즉시 발생 (시간 간격 없음)
                canvasEl.dispatchEvent(
                  new MouseEvent("mouseup", {
                    bubbles: true,
                    cancelable: true,
                    clientX: image.left + 10,
                    clientY: image.top + 10,
                  })
                );

                console.log(
                  "Pasted Image added, selected, and click fully simulated:",
                  image
                );
              };
            };
            reader.readAsDataURL(blob);
            break;
          }
        }
      }
    },
  },
  watch: {
    color(newVal) {
      if (this.canvas && this.canvas.freeDrawingBrush) {
        this.canvas.freeDrawingBrush.color = newVal;
      }

      if (this.currentObject) {
        this.currentObject.set({ stroke: newVal });
        this.canvas.renderAll();
      }
    },
    brushSize(newVal) {
      if (this.canvas && this.canvas.freeDrawingBrush) {
        this.canvas.freeDrawingBrush.width = parseInt(newVal, 10);
      }
    },
    showColorPicker(newVal) {
      if (this.canvas) {
        // 컬러 피커가 열려있을 때 캔버스 그리기 모드 비활성화
        if (newVal) {
          // 현재 상태 저장
          this._previousDrawingMode = this.canvas.isDrawingMode;
          // 그리기 모드 비활성화
          this.canvas.isDrawingMode = false;
          // 현재 진행 중인 그리기 취소
          if (this.currentObject) {
            this.canvas.remove(this.currentObject);
            this.currentObject = null;
          }
          this.isDrawing = false;
        } else {
          // 컬러 피커가 닫혔을 때 이전 상태로 복원
          if (this.mode === "pencil") {
            this.canvas.isDrawingMode = true;
          } else {
            this.canvas.isDrawingMode = false;
          }
        }
      }
    },
  },
};
</script>

<style scoped>
/* 전체 배경 및 중앙 정렬 */
.drawing-page {
  width: 100vw;
  height: 100vh;
  background-color: #f0f2f5;
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 24px;
  box-sizing: border-box;
  font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Oxygen,
    Ubuntu, Cantarell, "Open Sans", "Helvetica Neue", sans-serif;
}

/* 카드 형태의 UI */
.drawing-card {
  width: 100%;
  max-width: 1400px;
  height: 102%;
  max-height: 880px;
  background-color: #f8f9fb;
  border-radius: 24px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.08);
  padding: 22px;
  display: flex;
  flex-direction: column;
  overflow: visible;
  border: none;
}

/* 툴바 - 완전히 새로운 디자인 */
.toolbar {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  background-color: #f1f5f9;
  border-radius: 16px;
  padding: 6px;
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.03);
}

/* 툴바를 그룹화하기 위한 컨테이너 추가 */
.toolbar-group {
  display: flex;
  align-items: center;
  margin-right: 6px;
  gap: 5px;
  position: relative;
}

.toolbar-group:not(:last-child)::after {
  content: "";
  position: absolute;
  right: -3px;
  height: 24px;
  width: 2.8px;
  background-color: rgba(0, 0, 0, 0.35);
}

/* 버튼 새 디자인 - 붙어있는 디자인 */
.toolbar button {
  border: none;
  background: transparent;
  height: 35px;
  padding: 0 14px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  cursor: pointer;
  transition: all 0.2s ease;
  position: relative;
  border-radius: 10px;
}

.toolbar button i {
  font-size: 16px;
  transition: transform 0.15s ease;
}

/* 호버 효과 */
.toolbar button:hover:not(:disabled) {
  color: #334155;
  background-color: rgba(255, 255, 255, 0.8);
}

/* 활성 버튼 */
.toolbar button.active {
  color: #1e293b;
  background-color: white;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
  font-weight: 600;
}

.toolbar button.active i {
  color: #4f46e5;
  transform: scale(1.1);
}

/* 특별 버튼 스타일 */
.toolbar button.active.image-upload {
  color: #6366f1;
}

.toolbar button.active.download-button {
  color: #ec4899;
}

/* 비활성화 버튼 */
.toolbar button:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 셀렉트 박스 새 디자인 */
.toolbar select {
  border: none;
  background-color: transparent;
  height: 40px;
  padding: 0 28px 0 14px;
  font-size: 14px;
  font-weight: 500;
  color: #64748b;
  cursor: pointer;
  appearance: none;
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20' fill='%2364748b'%3E%3Cpath fill-rule='evenodd' d='M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z' clip-rule='evenodd'/%3E%3C/svg%3E");
  background-repeat: no-repeat;
  background-position: right 8px center;
  background-size: 16px;
  transition: all 0.2s ease;
  border-radius: 10px;
}

.toolbar select:hover:not(:disabled) {
  color: #334155;
  background-color: rgba(255, 255, 255, 0.8);
}

.toolbar select:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 색상 팔레트 새 디자인 */
.color-palette {
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 16px;
  background-color: #f1f5f9;
  border-radius: 16px;
  padding: 8px 16px; /* 좌우 패딩 약간 증가 */
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.03);
  width: 100%; /* 너비 100% 확보 */
}

.color-grid {
  display: flex;
  flex-wrap: nowrap; /* 줄바꿈 방지 */
  gap: 10px;
  justify-content: center;
  width: 100%; /* 컨테이너 너비의 100% 사용 */
  overflow-x: hidden; /* 스크롤바 숨김 */
  padding: 7px 0;
  align-items: center;
}

/* 스크롤바 스타일 완전히 숨기기 */
.color-grid::-webkit-scrollbar {
  height: 0;
  width: 0;
  display: none;
}

.color-swatch,
.rainbow-selector {
  width: 26px;
  height: 26px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.15s ease;
  position: relative;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.1);
}

.color-swatch:hover,
.rainbow-selector:hover {
  transform: scale(1.15);
  z-index: 5;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1);
}

.color-swatch.active {
  transform: scale(1.1);
  box-shadow: 0 0 0 2px white, 0 0 0 4px #818a9a;
  z-index: 10;
}

.rainbow-selector {
  background: linear-gradient(
    to right,
    red,
    orange,
    yellow,
    green,
    blue,
    indigo,
    violet
  );
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}

.rainbow-icon {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
}

.rainbow-icon i {
  font-size: 14px;
  font-weight: bold;
  color: white;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  line-height: 1;
}

/* 컬러 피커 모달 새 디자인 */
.color-picker-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 360px;
  background: rgba(255, 255, 255, 0.98);
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2), 0 0 0 1px rgba(0, 0, 0, 0.04);
  z-index: 9999;
  overflow: hidden;
  backdrop-filter: blur(10px);
}

.color-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
}

.color-picker-header h3 {
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #1e293b;
}

.close-btn {
  width: 30px;
  height: 30px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.04);
  border: none;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #64748b;
  transition: all 0.2s ease;
}

.close-btn:hover {
  background: rgba(0, 0, 0, 0.08);
  color: #1e293b;
}

.color-picker-content {
  padding: 20px;
}

.color-spectrum {
  width: 100%;
  height: 160px;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 16px;
  position: relative;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.06);
}

.spectrum-gradient {
  width: 100%;
  height: 100%;
  background: linear-gradient(
    to right,
    #ff0000,
    #ffff00,
    #00ff00,
    #00ffff,
    #0000ff,
    #ff00ff,
    #ff0000
  );
}

.color-preview-container {
  margin-bottom: 16px;
}

.color-preview {
  width: 100%;
  height: 40px;
  border-radius: 10px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04), inset 0 0 0 1px rgba(0, 0, 0, 0.08);
}

/* 컬러 입력 필드 - 세로 배치로 수정 */
.color-inputs {
  margin-bottom: 16px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input-group {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: 12px;
}

.input-group label {
  font-size: 12px;
  font-weight: 500;
  color: #64748b;
  min-width: 50px;
  text-align: left;
}

.input-group input {
  padding: 8px 12px;
  border-radius: 8px;
  border: 1px solid rgba(0, 0, 0, 0.08);
  font-size: 14px;
  background-color: rgba(0, 0, 0, 0.02);
  transition: all 0.2s ease;
  flex: 1;
}

.input-group input:focus {
  border-color: #4f46e5;
  box-shadow: 0 0 0 2px rgba(79, 70, 229, 0.15);
  outline: none;
  background-color: white;
}

/* 컬러 피커 버튼 */
.color-picker-buttons {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  margin-top: 10px;
}

.color-picker-buttons button {
  border: none;
  border-radius: 10px;
  padding: 10px 18px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.color-picker-buttons button:first-child {
  background-color: #2563eb;
  color: white;
  box-shadow: 0 2px 8px rgba(37, 99, 235, 0.25);
}

.color-picker-buttons button:first-child:hover {
  background-color: #1d4ed8;
  box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
  transform: translateY(-1px);
}

.color-picker-buttons button:last-child {
  background-color: rgba(0, 0, 0, 0.05);
  color: #64748b;
}

.color-picker-buttons button:last-child:hover {
  background-color: rgba(0, 0, 0, 0.08);
  color: #1e293b;
  transform: translateY(-1px);
}

.color-picker-buttons button:active {
  transform: translateY(1px);
}

/* 캔버스 새 디자인 */
.canvas-container {
  flex-grow: 1;
  background-color: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 20px rgba(0, 0, 0, 0.06),
    inset 0 0 0 1px rgba(0, 0, 0, 0.04);
  display: flex;
  justify-content: center;
  align-items: center;
}

canvas {
  max-width: 100%;
  max-height: 100%;
  background-color: white;
}

/* 기타 폼 요소 */
button:focus,
select:focus,
input:focus {
  outline: none;
}

/* Vue 템플릿 수정을 위한 추가 클래스들 */
.toolbar-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 16px;
}

/* 버튼 내용 스타일링 */
.toolbar button span,
.toolbar select {
  font-weight: 500;
}

/* 상단 액션 헤더 - 좌우 정렬 */
.toolbar-actions {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10px;
}

.toolbar-actions-left,
.toolbar-actions-right {
  display: flex;
  gap: 8px;
}

/* 특수 버튼 스타일 */
.primary-action {
  background: linear-gradient(135deg, #4f46e5, #6366f1) !important;
  color: white !important;
  box-shadow: 0 2px 10px rgba(99, 102, 241, 0.3) !important;
}

.danger-action {
  background: linear-gradient(135deg, #ef4444, #f43f5e) !important;
  color: white !important;
}

.primary-action:hover,
.danger-action:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15) !important;
}

.toolbar-justify {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.toolbar-left,
.toolbar-right {
  display: flex;
  align-items: center;
}
</style>
