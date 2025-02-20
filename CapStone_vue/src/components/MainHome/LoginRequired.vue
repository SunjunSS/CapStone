<template>
  <div class="empty-recent-container">
    <div class="empty-recent-icon">
      <svg
        width="80"
        height="80"
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <!-- 사용자 아이콘 -->
        <path
          d="M12 12a4 4 0 100-8 4 4 0 000 8z"
          stroke="#9AA0A6"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
        <!-- 로그인/사용자 바디 부분 -->
        <path
          d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
          stroke="#9AA0A6"
          stroke-width="2"
          stroke-linecap="round"
          stroke-linejoin="round"
        />
      </svg>
    </div>
    <h3 class="empty-recent-title">로그인하고 시작해볼까요?</h3>
    <p class="empty-recent-description">다양한 기능이 당신을 기다리고 있어요</p>
  </div>
</template>

<script>
export default {
  name: "LoginRequired",
};
</script>

<style scoped>
.empty-recent-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  position: relative; /* absolute에서 relative로 변경 */
  margin: 15% auto; /* top/left/transform 대신 margin으로 조정 */
  padding: 60px 20px;
  text-align: center;
  width: 100%;
  max-width: 500px;
}

.empty-recent-icon {
  margin-bottom: 20px;
  background-color: #f5f5f5;
  width: 160px;
  height: 160px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.empty-recent-title {
  margin-bottom: 5px;
}

.empty-recent-description {
  font-size: 14px;
  color: #5f6368;
  max-width: 400px;
  margin-bottom: 24px;
  line-height: 1.5;
}
</style>
