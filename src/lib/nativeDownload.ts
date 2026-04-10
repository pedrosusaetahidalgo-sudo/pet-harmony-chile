import { Filesystem, Directory } from '@capacitor/filesystem';
import { Share } from '@capacitor/share';
import { isNative } from './platform';
import { toast } from 'sonner';

export async function downloadFile(url: string, fileName: string) {
  if (!isNative()) {
    window.open(url, '_blank');
    return;
  }

  try {
    toast.info('Descargando archivo...');

    const response = await fetch(url);
    const blob = await response.blob();
    const reader = new FileReader();

    const base64 = await new Promise<string>((resolve, reject) => {
      reader.onloadend = () => {
        const result = reader.result as string;
        resolve(result.split(',')[1]);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });

    const savedFile = await Filesystem.writeFile({
      path: fileName,
      data: base64,
      directory: Directory.Cache,
    });

    await Share.share({
      title: fileName,
      url: savedFile.uri,
    });

    toast.success('Archivo descargado');
  } catch (error) {
    console.error('Error downloading file:', error);
    toast.error('No se pudo descargar el archivo');
  }
}
