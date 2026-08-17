<?php

namespace App\Services;

use Exception;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\File;

class CampusImageProcessorService
{
    /**
     * Ancho y alto estándar para tarjetas de sedes universitarias (proporción 16:10 sin distorsión).
     */
    protected int $targetWidth = 800;
    protected int $targetHeight = 500;
    protected int $quality = 85;

    /**
     * Procesar y estandarizar una imagen de sede universitaria conservando proporciones sin deformar.
     *
     * @param string|UploadedFile $sourcePath Ruta al archivo fuente o instancia UploadedFile
     * @param string $destinationPath Ruta de destino para guardar el archivo procesado
     * @param string $format Formato de salida ('webp' | 'jpg' | 'png')
     * @return array Metadatos de la imagen procesada
     * @throws Exception
     */
    public function processCampusPhoto(
        string|UploadedFile $sourcePath,
        string $destinationPath,
        string $format = 'webp'
    ): array {
        $realSource = $sourcePath instanceof UploadedFile ? $sourcePath->getRealPath() : $sourcePath;

        if (!file_exists($realSource)) {
            throw new Exception("El archivo fuente de imagen no existe: {$realSource}");
        }

        // 1. Obtener información y dimensiones originales
        $imageInfo = @getimagesize($realSource);
        if (!$imageInfo) {
            throw new Exception("El archivo no es una imagen válida o compatible.");
        }

        [$srcWidth, $srcHeight, $imageType] = $imageInfo;

        // 2. Crear recurso GD según el tipo de imagen original
        $srcImage = match ($imageType) {
            IMAGETYPE_JPEG => @imagecreatefromjpeg($realSource),
            IMAGETYPE_PNG => @imagecreatefrompng($realSource),
            IMAGETYPE_WEBP => function_exists('imagecreatefromwebp') ? @imagecreatefromwebp($realSource) : null,
            default => null,
        };

        if (!$srcImage) {
            throw new Exception("Formato de imagen no soportado por GD (se requiere JPG, PNG o WebP).");
        }

        // 3. Algoritmo de Cobertura Inteligente (Smart Cover-Crop sin Distorsión)
        $srcRatio = $srcWidth / $srcHeight;
        $targetRatio = $this->targetWidth / $this->targetHeight;

        if ($srcRatio > $targetRatio) {
            // La imagen original es más ancha: recortar lateralmente manteniendo el centro
            $cropHeight = $srcHeight;
            $cropWidth = (int) round($srcHeight * $targetRatio);
            $cropX = (int) round(($srcWidth - $cropWidth) / 2);
            $cropY = 0;
        } else {
            // La imagen original es más alta: recortar superior/inferior manteniendo el tercio central
            $cropWidth = $srcWidth;
            $cropHeight = (int) round($srcWidth / $targetRatio);
            $cropX = 0;
            $cropY = (int) round(($srcHeight - $cropHeight) * 0.35); // Enfoque ligeramente superior para arquitectura
        }

        // 4. Crear lienzo de destino con resolución estándar
        $dstImage = imagecreatetruecolor($this->targetWidth, $this->targetHeight);

        // Preservar transparencia si es necesario
        imagealphablending($dstImage, false);
        imagesavealpha($dstImage, true);

        // 5. Remuestreo bilineal de alta calidad
        imagecopyresampled(
            $dstImage,
            $srcImage,
            0,
            0,
            $cropX,
            $cropY,
            $this->targetWidth,
            $this->targetHeight,
            $cropWidth,
            $cropHeight
        );

        // Asegurar que el directorio de destino exista
        $destDir = dirname($destinationPath);
        if (!is_dir($destDir)) {
            mkdir($destDir, 0755, true);
        }

        // 6. Exportar imagen estandarizada
        $success = match (strtolower($format)) {
            'webp' => function_exists('imagewebp') ? imagewebp($dstImage, $destinationPath, $this->quality) : imagejpeg($dstImage, $destinationPath, $this->quality),
            'jpg', 'jpeg' => imagejpeg($dstImage, $destinationPath, $this->quality),
            'png' => imagepng($dstImage, $destinationPath, 8),
            default => imagejpeg($dstImage, $destinationPath, $this->quality),
        };

        // Liberar memoria de recursos GD
        imagedestroy($srcImage);
        imagedestroy($dstImage);

        if (!$success) {
            throw new Exception("Error al escribir la imagen estandarizada en: {$destinationPath}");
        }

        return [
            'width' => $this->targetWidth,
            'height' => $this->targetHeight,
            'format' => $format,
            'file_size_bytes' => filesize($destinationPath),
            'file_path' => $destinationPath,
        ];
    }
}
