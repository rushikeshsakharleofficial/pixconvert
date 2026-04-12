import { Link, useLocation } from 'react-router-dom';
import { toolsData } from '@/data/toolsData';
import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarLabel,
  MenubarMenu,
  MenubarSeparator,
  MenubarSub,
  MenubarSubContent,
  MenubarSubTrigger,
  MenubarTrigger,
} from '@/components/ui/menubar';

const AppMenuBar = ({ onNavigate }) => {
  const location = useLocation();
  const activePath = location.pathname;

  const popularTools = [
    { name: 'Converter', path: '/tools/converter', icon: '🔄' },
    { name: 'Merge PDF', path: '/tools/merge-pdf', icon: '📁' },
    { name: 'Split PDF', path: '/tools/split-pdf', icon: '✂️' },
    { name: 'Unlock PDF', path: '/tools/pdf', icon: '🔓' },
  ];

  return (
    <Menubar className="app-menubar desktop-only">
      <MenubarMenu>
        <MenubarTrigger className="gap-2">
          ✨ Popular
        </MenubarTrigger>
        <MenubarContent className="w-72">
          <MenubarLabel>Popular tools</MenubarLabel>
          {popularTools.map((item) => (
            <MenubarItem key={item.path} asChild className={activePath === item.path ? 'app-menubar-item-active' : ''}>
              <Link to={item.path} onClick={() => onNavigate?.(item.path)}>
                <span className="app-menubar-emoji">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </MenubarItem>
          ))}
          <MenubarSeparator />
          <MenubarItem asChild>
            <Link to="/tools" onClick={() => onNavigate?.('/tools')}>
              Browse all tools
            </Link>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="gap-2">
          🛠️ Tools
        </MenubarTrigger>
        <MenubarContent className="w-64">
          {toolsData.map((category) => (
            <MenubarSub key={category.category}>
              <MenubarSubTrigger className="gap-2">
                {category.category}
              </MenubarSubTrigger>
              <MenubarSubContent className="w-64">
                {category.items.filter(i => !i.comingSoon).map((item) => (
                  <MenubarItem key={item.path} asChild className={activePath === item.path ? 'app-menubar-item-active' : ''}>
                    <Link to={item.path} onClick={() => onNavigate?.(item.path)}>
                      <span className="app-menubar-emoji">{item.icon}</span>
                      <span>{item.name}</span>
                    </Link>
                  </MenubarItem>
                ))}
              </MenubarSubContent>
            </MenubarSub>
          ))}
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="gap-2">
          ℹ️ Info
        </MenubarTrigger>
        <MenubarContent className="w-52">
          <MenubarItem asChild className={activePath === '/about' ? 'app-menubar-item-active' : ''}>
            <Link to="/about" onClick={() => onNavigate?.('/about')}>About Us</Link>
          </MenubarItem>
          <MenubarItem asChild className={activePath === '/privacy' ? 'app-menubar-item-active' : ''}>
            <Link to="/privacy" onClick={() => onNavigate?.('/privacy')}>Privacy Policy</Link>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem asChild className={activePath === '/contact' ? 'app-menubar-item-active' : ''}>
            <Link to="/contact" onClick={() => onNavigate?.('/contact')}>Contact Support</Link>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>
    </Menubar>
  );
};

export default AppMenuBar;
