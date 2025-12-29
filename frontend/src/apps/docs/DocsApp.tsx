import { useEffect, useRef } from 'react';
import type { AppProps } from '../../types/app';

const DOCS_URL = 'https://docs.tokamak.network/home';

export function DocsApp({ onClose }: AppProps) {
  const opened = useRef(false);

  useEffect(() => {
    if (!opened.current) {
      opened.current = true;
      window.open(DOCS_URL, '_blank');
      onClose();
    }
  }, [onClose]);

  return null;
}
