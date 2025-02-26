--Drawing(컬러 피커 박스 현재 선택된 색상 실시간 반영 / 취소 -> 기존 색상표시 /
preview, slider 새로 방향)--

<template>
  <div class="drawing-app">
    <h1>그림판</h1>
    <div class="toolbar">
      <button
        @click="setMode('pencil')"
        :class="{ active: mode === 'pencil' }"
        :disabled="showColorPicker"
      >
        연필
      </button>
      <button
        @click="setMode('line')"
        :class="{ active: mode === 'line' }"
        :disabled="showColorPicker"
      >
        직선
      </button>
      <button
        @click="setMode('rect')"
        :class="{ active: mode === 'rect' }"
        :disabled="showColorPicker"
      >
        사각형
      </button>
      <button
        @click="setMode('circle')"
        :class="{ active: mode === 'circle' }"
        :disabled="showColorPicker"
      >
        원
      </button>
      <button @click="clearCanvas" :disabled="showColorPicker">
        모두 지우기
      </button>
      <select v-model="brushSize" :disabled="showColorPicker">
        <option value="1">1px</option>
        <option value="3">3px</option>
        <option value="5">5px</option>
        <option value="10">10px</option>
        <option value="15">15px</option>
        <option value="20">20px</option>
      </select>
    </div>

    <!-- 색상 팔레트 수정 -->
    <div class="color-palette">
      <div class="color-grid">
        <!-- 기본 색상들 -->
        <div
          v-for="(colorValue, index) in basicColors"
          :key="'color-' + index"
          class="color-swatch"
          :style="{ backgroundColor: colorValue }"
          :class="{ active: color === colorValue }"
          @click="!showColorPicker && setColor(colorValue)"
        ></div>
        <!-- 무지개 색상 선택 아이콘 -->
        <div class="rainbow-selector" @click="openColorPicker">
          <div class="rainbow-icon">+</div>
        </div>
      </div>

      <!-- 컬러 피커 대화상자 -->
      <div v-if="showColorPicker" class="color-picker-modal">
        <div class="color-picker-header">
          <h3>색 편집</h3>
          <button class="close-btn" @click="cancelColorPicker">✕</button>
        </div>

        <div class="color-picker-content">
          <!-- 컬러 스펙트럼 -->
          <div
            class="color-spectrum"
            ref="colorSpectrum"
            @click="pickColorFromSpectrum"
          >
            <!-- 스펙트럼 이미지 대신 gradient 사용 -->
            <div class="spectrum-gradient"></div>
          </div>

          <!-- 색상 미리보기 -->
          <div class="color-preview-container">
            <div
              class="color-preview"
              :style="{ backgroundColor: tempColor }"
            ></div>
          </div>

          <!-- RGB 입력 필드 -->
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

          <!-- 버튼 -->
          <div class="color-picker-buttons">
            <button @click="applyColor">확인</button>
            <button @click="cancelColorPicker">취소</button>
          </div>
        </div>
      </div>
    </div>

    <div class="canvas-container">
      <canvas ref="canvas"></canvas>
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
      mode: "pencil",
      color: "#990000", // 초기 색상을 붉은색으로 설정
      tempColor: "#990000", // 컬러 피커에서 임시로 선택한 색상
      hexColor: "#990000", // HEX 입력용
      rgbValues: { r: 153, g: 0, b: 0 }, // RGB 입력용
      brushSize: 5,
      isDrawing: false,
      startPoint: null,
      currentObject: null,
      showColorPicker: false,
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
  },
  beforeDestroy() {
    // 컴포넌트 제거 시 이벤트 리스너 정리
    window.removeEventListener("resize", this.resizeCanvas);
    if (this.canvas) {
      this.canvas.off("mouse:down", this.onMouseDown);
      this.canvas.off("mouse:move", this.onMouseMove);
      this.canvas.off("mouse:up", this.onMouseUp);
      this.canvas.dispose();
    }
  },
  methods: {
    initCanvas() {
      console.log("Initializing canvas...");
      console.log("Fabric object:", fabric);

      try {
        // 캔버스 크기를 화면 크기에 맞게 설정
        const canvasContainer = document.querySelector(".canvas-container");
        const containerWidth = canvasContainer.clientWidth;

        // 툴바와 헤더, 팔레트 높이 계산 (대략적인 값)
        const toolbarHeight = document.querySelector(".toolbar").offsetHeight;
        const headerHeight = document.querySelector("h1").offsetHeight;
        const paletteHeight = 100; // 색상 팔레트의 대략적인 높이
        const totalHeaderHeight =
          toolbarHeight + headerHeight + paletteHeight + 40; // 마진과 패딩 추가

        // 뷰포트의 남은 공간을 계산하여 캔버스 높이 설정
        const containerHeight = window.innerHeight - totalHeaderHeight;

        // ref를 사용하여 캔버스 요소에 접근
        this.canvas = new fabric.Canvas(this.$refs.canvas, {
          isDrawingMode: true,
          backgroundColor: "#ffffff",
          width: containerWidth,
          height: containerHeight,
        });

        console.log("Canvas created:", this.canvas);

        // freeDrawingBrush가 존재하는지 확인하고 없으면 생성
        if (!this.canvas.freeDrawingBrush) {
          console.log("Creating PencilBrush...");
          this.canvas.freeDrawingBrush = new fabric.PencilBrush(this.canvas);
        }

        // 이제 브러시 속성 설정
        this.canvas.freeDrawingBrush.color = this.color;
        this.canvas.freeDrawingBrush.width = parseInt(this.brushSize, 10);

        // 캔버스 이벤트 설정
        this.canvas.on("mouse:down", this.onMouseDown);
        this.canvas.on("mouse:move", this.onMouseMove);
        this.canvas.on("mouse:up", this.onMouseUp);

        console.log("Canvas initialization complete");
      } catch (error) {
        console.error("Error initializing canvas:", error);
      }
    },

    resizeCanvas() {
      if (!this.canvas) return;

      // 현재 캔버스 내용을 저장
      const json = this.canvas.toJSON();

      // 캔버스 컨테이너의 새 크기 가져오기
      const canvasContainer = document.querySelector(".canvas-container");
      const containerWidth = canvasContainer.clientWidth;

      // 툴바와 헤더 높이 계산
      const toolbarHeight = document.querySelector(".toolbar").offsetHeight;
      const headerHeight = document.querySelector("h1").offsetHeight;
      const paletteHeight = 100; // 색상 팔레트의 대략적인 높이
      const totalHeaderHeight =
        toolbarHeight + headerHeight + paletteHeight + 40; // 마진과 패딩 추가

      // 뷰포트의 남은 공간을 계산하여 캔버스 높이 설정
      const containerHeight = window.innerHeight - totalHeaderHeight;

      // 캔버스 크기 설정
      this.canvas.setWidth(containerWidth);
      this.canvas.setHeight(containerHeight);

      // 저장된 내용 복원
      this.canvas.loadFromJSON(json, this.canvas.renderAll.bind(this.canvas));
    },

    setMode(mode) {
      this.mode = mode;
      if (this.canvas) {
        this.canvas.isDrawingMode = mode === "pencil";
        this.canvas.selection = true;
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
      }
    },

    onMouseDown(o) {
      if (this.mode === "pencil" || !this.canvas || this.showColorPicker)
        return;

      this.isDrawing = true;
      const pointer = this.canvas.getPointer(o.e);
      this.startPoint = { x: pointer.x, y: pointer.y };

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
            selectable: true,
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
          selectable: true,
        });
      } else if (this.mode === "circle") {
        this.currentObject = new fabric.Circle({
          left: this.startPoint.x,
          top: this.startPoint.y,
          radius: 0,
          fill: "transparent",
          stroke: this.color,
          strokeWidth: parseInt(this.brushSize, 10),
          selectable: true,
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
      this.currentObject = null;
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
.drawing-app {
  text-align: center;
  margin: 0;
  width: 100%;
  height: 100vh;
  box-sizing: border-box;
  padding: 10px;
  display: flex;
  flex-direction: column;
}

h1 {
  margin-top: 0;
  margin-bottom: 10px;
}

.toolbar {
  margin-bottom: 10px;
}

.toolbar button {
  margin: 0 5px;
  padding: 8px 12px;
  cursor: pointer;
}

.toolbar button.active {
  background-color: #4caf50;
  color: white;
}

/* 색상 팔레트 스타일 수정 */
.color-palette {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 20px;
  position: relative;
}

.color-grid {
  display: grid;
  grid-template-columns: repeat(10, 1fr);
  gap: 5px;
  max-width: 600px;
  margin: 0 auto;
}

.color-swatch {
  width: 25px;
  height: 25px;
  cursor: pointer;
  border: 1px solid #ccc;
  transition: transform 0.2s;
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.active {
  border: 2px solid #333;
  transform: scale(1.1);
}

.rainbow-selector {
  width: 25px;
  height: 25px;
  cursor: pointer;
  border: 1px solid #ccc;
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
}

.rainbow-icon {
  color: white;
  font-weight: bold;
  font-size: 18px;
  text-shadow: 1px 1px 1px rgba(0, 0, 0, 0.7);
}

/* 컬러 피커 모달 스타일 */
.color-picker-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 350px;
  background: white;
  border-radius: 5px;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
  z-index: 1000;
}

.color-picker-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 10px 15px;
  border-bottom: 1px solid #eee;
}

.color-picker-header h3 {
  margin: 0;
  font-size: 16px;
}

.close-btn {
  background: none;
  border: none;
  font-size: 18px;
  cursor: pointer;
}

.color-picker-content {
  padding: 15px;
}

.color-spectrum {
  width: 100%;
  height: 150px;
  margin-bottom: 15px;
  border: 1px solid #ccc;
  cursor: crosshair;
  position: relative;
  overflow: hidden;
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
  background-size: 100% 100%;
}

.color-preview-container {
  display: flex;
  flex-direction: column; /* 세로 방향으로 변경 */
  margin-bottom: 15px;
  gap: 10px; /* 요소 간 간격 추가 */
}

.color-preview {
  width: 100%; /* 전체 너비 사용 */
  height: 40px; /* 높이 조정 */
  border: 1px solid #ccc;
}

.color-inputs {
  margin-bottom: 15px;
}

.input-group {
  display: flex;
  align-items: center;
  margin-bottom: 10px;
}

.input-group label {
  width: 60px;
  text-align: left;
}

.input-group input {
  flex-grow: 1;
  padding: 5px;
}

.color-picker-buttons {
  display: flex;
  justify-content: flex-end;
}

.color-picker-buttons button {
  margin-left: 10px;
  padding: 5px 15px;
}

.canvas-container {
  width: 100%;
  flex-grow: 1;
  display: flex;
  justify-content: center;
  overflow: hidden;
}

canvas {
  border: 1px solid #ccc;
  max-width: 100%;
  max-height: 100%;
}

.toolbar button:disabled,
.toolbar select:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.color-swatch.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}
</style>
