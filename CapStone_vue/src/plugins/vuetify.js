import "vuetify/styles";
import '@mdi/font/css/materialdesignicons.css'; // MDI 스타일을 포함
import { createVuetify } from "vuetify";
import * as components from "vuetify/components";
import * as directives from "vuetify/directives";

export default createVuetify({
    components,
    directives,
    icons: {
        defaultSet: 'mdi', // MDI를 기본 아이콘 세트로 설정
    },
});
