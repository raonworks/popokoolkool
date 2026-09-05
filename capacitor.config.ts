import type { CapacitorConfig } from "@capacitor/cli";

const config: CapacitorConfig = {
  appId: "com.raonworks.apps",
  appName: "popokoolkool",
  webDir: "dist",
  server: {
    url: "http://172.16.0.130:5173/",
    cleartext: true, //HTTP 서버 접속 허용
    androidScheme: "https",
  },
};

export default config;
