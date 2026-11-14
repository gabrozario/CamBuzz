import { useEffect, useState } from 'react';

/**
 * No Android, marcadores com visual próprio são "fotografados" como imagem.
 * Deixamos `tracksViewChanges` ligado só por um instante depois de montar
 * (ou depois de mudar algo em `deps`) para a foto sair certa, e depois
 * desligamos — senão o mapa fica lento.
 *
 * Uso: `const tracks = useTracksViewChanges([selected]);` e `<Marker tracksViewChanges={tracks}>`.
 */
export function useTracksViewChanges(deps: unknown[] = []) {
  const [tracks, setTracks] = useState(true);
  useEffect(() => {
    setTracks(true);
    const t = setTimeout(() => setTracks(false), 800);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
  return tracks;
}
