import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.signalsai.app',
  appName: 'BTC Signals AI',
  webDir: 'web', // <- coloque aqui a pasta com os arquivos estáticos para o app Android
  bundledWebRuntime: false
};

export default config;
