import AppShell from '../../components/AppShell';

// Vale para todas as telas em /views: navegação, logout e guarda de sessão
export default function ViewsLayout({ children }) {
  return <AppShell>{children}</AppShell>;
}
