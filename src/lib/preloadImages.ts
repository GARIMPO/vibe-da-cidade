/**
 * Utilitário para pré-carregamento de imagens
 * Ajuda a melhorar a performance da aplicação pré-carregando recursos em segundo plano
 */

/**
 * Pré-carrega uma única imagem
 * @param src URL da imagem
 * @returns Promise que resolve quando a imagem for carregada
 */
export const preloadImage = (src: string): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.src = src;
    img.onload = () => resolve(img);
    img.onerror = (err) => reject(err);
  });
};

/**
 * Pré-carrega múltiplas imagens em paralelo
 * @param sources Array de URLs de imagens
 * @returns Promise que resolve quando todas as imagens forem carregadas
 */
export const preloadImages = (sources: string[]): Promise<HTMLImageElement[]> => {
  return Promise.all(sources.map(preloadImage));
};

/**
 * Pré-carrega as imagens comuns usadas na aplicação
 * @param priorityLevel Nível de prioridade (1: alta, 2: média, 3: baixa)
 */
export const preloadCommonImages = (priorityLevel: 1 | 2 | 3 = 1): void => {
  // Imagens de alta prioridade (carregadas imediatamente)
  if (priorityLevel === 1) {
    const highPriorityImages = [
      // Imagens de UI e logo que aparecem imediatamente
      '/logo.png',
      '/favicon.ico'
    ];
    
    preloadImages(highPriorityImages).catch(err => {
      console.warn('Erro ao pré-carregar imagens de alta prioridade:', err);
    });
  }
  
  // Imagens de média prioridade (carregadas após o carregamento inicial)
  if (priorityLevel <= 2) {
    // Usar requestIdleCallback se disponível, ou setTimeout como fallback
    const scheduleLoad = window.requestIdleCallback || ((cb) => setTimeout(cb, 1000));
    
    scheduleLoad(() => {
      const mediumPriorityImages = [
        // Imagens de fundo e elementos que aparecem ao rolar
      ];
      
      preloadImages(mediumPriorityImages).catch(err => {
        console.warn('Erro ao pré-carregar imagens de média prioridade:', err);
      });
    });
  }
  
  // Imagens de baixa prioridade (carregadas quando o browser estiver ocioso)
  if (priorityLevel <= 3) {
    const scheduleLowPriority = window.requestIdleCallback || ((cb) => setTimeout(cb, 5000));
    
    scheduleLowPriority(() => {
      const lowPriorityImages = [
        // Imagens de página secundárias que podem ser visitadas
      ];
      
      preloadImages(lowPriorityImages).catch(err => {
        console.warn('Erro ao pré-carregar imagens de baixa prioridade:', err);
      });
    });
  }
};

/**
 * Tipo para requestIdleCallback que não está em todos os browsers
 */
declare global {
  interface Window {
    requestIdleCallback: (
      callback: (deadline: { didTimeout: boolean; timeRemaining: () => number }) => void,
      options?: { timeout: number }
    ) => number;
  }
}

export default {
  preloadImage,
  preloadImages,
  preloadCommonImages
}; 