import React, { memo, useState, useEffect } from 'react';

interface OptimizedImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
  priority?: boolean;
  placeholderColor?: string;
  onLoad?: () => void;
}

/**
 * Componente de imagem otimizada que usa formatos modernos e lazy loading
 * - Carrega formatos modernos (webp) quando suportados
 * - Usa carregamento lazy por padrão
 * - Mostra um placeholder durante o carregamento para evitar layout shift
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  width,
  height,
  className = '',
  objectFit = 'cover',
  priority = false,
  placeholderColor = '#121212',
  onLoad
}) => {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);
  
  // Extrai a extensão do arquivo
  const getExtension = (url: string) => {
    const parts = url.split('.');
    return parts[parts.length - 1].toLowerCase();
  };
  
  // Verifica se o navegador suporta formatos modernos
  const supportsWebp = () => {
    const canvas = document.createElement('canvas');
    if (canvas && canvas.getContext && canvas.getContext('2d')) {
      return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0;
    }
    return false;
  };
  
  // Tenta converter a URL para webp se suportado e a imagem não for já um formato moderno
  const getOptimizedSrc = (originalSrc: string) => {
    const ext = getExtension(originalSrc);
    if (['webp', 'avif'].includes(ext)) {
      return originalSrc; // Já é um formato moderno
    }
    
    if (supportsWebp() && ['jpg', 'jpeg', 'png'].includes(ext)) {
      // Verifica se a URL é do Supabase
      if (originalSrc.includes('supabase.co')) {
        // Para URLs do Supabase, podemos tentar adicionar parâmetros de formato
        return originalSrc.replace(/\.(jpg|jpeg|png)/i, '.webp');
      }
    }
    
    return originalSrc;
  };
  
  // Gera o placeholder style baseado nas proporções
  const getPlaceholderStyle = () => {
    const aspectRatio = width && height ? width / height : 16 / 9;
    
    return {
      backgroundColor: placeholderColor,
      paddingBottom: `${(1 / aspectRatio) * 100}%`,
      width: '100%',
      height: 0,
      position: 'relative' as const
    };
  };
  
  const handleLoad = () => {
    setLoaded(true);
    if (onLoad) onLoad();
  };
  
  const handleError = () => {
    setError(true);
    console.warn(`Falha ao carregar imagem: ${src}`);
  };
  
  // Style para o objeto fit
  const imgStyle = {
    objectFit,
    opacity: loaded ? 1 : 0,
    transition: 'opacity 0.3s ease-in-out',
    position: 'absolute' as const,
    top: 0,
    left: 0,
    width: '100%',
    height: '100%',
  };
  
  return (
    <div className={`image-container ${className}`} style={{ position: 'relative', overflow: 'hidden' }}>
      <div style={getPlaceholderStyle()}>
        <img
          src={error ? src : getOptimizedSrc(src)} // Usa a URL original em caso de erro
          alt={alt}
          loading={priority ? 'eager' : 'lazy'}
          onLoad={handleLoad}
          onError={handleError}
          style={imgStyle}
          width={width}
          height={height}
          decoding={priority ? 'sync' : 'async'}
          className={`hardware-accelerated ${loaded ? 'loaded' : ''}`}
        />
      </div>
    </div>
  );
};

export default memo(OptimizedImage); 