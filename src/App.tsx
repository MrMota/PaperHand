import { useEffect, useState } from 'react';
import { Home } from './components/Home';
import { EditorView } from './components/EditorView';
import { About } from './components/About';
import { Privacy, Terms } from './components/Legal';

function parse() {
  const h = location.hash.replace(/^#\/?/, '');
  const [a, b] = h.split('/');
  if (a === 'design' && b) return { name: 'design' as const, id: b };
  if (a === 'about') return { name: 'about' as const };
  if (a === 'privacy') return { name: 'privacy' as const };
  if (a === 'terms') return { name: 'terms' as const };
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
  if (route.name === 'about') return <About />;
  if (route.name === 'privacy') return <Privacy />;
  if (route.name === 'terms') return <Terms />;
  return <Home view={route.name} initialCat={route.name === 'templates' ? route.cat : undefined} />;
}
