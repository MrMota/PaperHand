import { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { EditorView } from './components/EditorView';

function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [a, b] = h.split('/');
  if (a === 'design' && b) return { name: 'design' as const, id: b };
  if (a === 'templates') return { name: 'templates' as const, cat: b ? decodeURIComponent(b) : undefined };
  return { name: 'home' as const };
}

export const go = (path: string) => { location.hash = path; };

export function App() {
  const [route, setRoute] = useState(parse);
  useEffect(() => {
    const on = () => setRoute(parse());
    window.addEventListener('hashchange', on);
    return () => window.removeEventListener('hashchange', on);
  }, []);
  if (route.name === 'design') return <EditorView key={route.id} id={route.id} />;
  return <Home view={route.name} initialCat={route.name === 'templates' ? route.cat : undefined} />;
}
