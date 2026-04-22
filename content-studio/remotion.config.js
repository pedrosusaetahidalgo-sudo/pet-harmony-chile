import { Config } from '@remotion/cli/config';

Config.setVideoImageFormat('jpeg');
Config.setEntryPoint('remotion/index.jsx');
Config.setPublicDir('assets');
// H.264 por defecto (MP4). Calidad equilibrada para redes.
Config.setCodec('h264');
