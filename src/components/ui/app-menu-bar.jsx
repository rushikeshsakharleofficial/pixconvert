import { Link, useLocation } from 'react-router-dom';
import {
  FolderOpen,
  Sparkles,
  Shield,
  ArrowLeftRight,
  FileText,
  Info,
  Mail,
  Lock,
  ChevronRight,
} from 'lucide-react';

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

const POPULAR_TOOLS = [
  '/tools/converter',
  '/tools/merge-pdf',
  '/tools/split-pdf',
  '/tools/pdf',
  '/tools/sign-pdf',
  '/tools/compare-pdf',
];

const CATEGORY_ICONS = {
  'Media Tools': Sparkles,
  'Image Conversion': ArrowLeftRight,
  'Organize PDF': FolderOpen,
  'Optimize PDF': FileText,
  'Convert to PDF': FileText,
  'Convert from PDF': FileText,
  'Edit PDF': FileText,
  'PDF Security': Shield,
  'PDF Intelligence': Sparkles,
};

const AppMenuBar = ({ onNavigate }) => {
  const location = useLocation();
  const activePath = location.pathname;

  const activeCategories = toolsData
    .map((category) => ({
      ...category,
      items: category.items.filter((item) => !item.comingSoon),
    }))
    .filter((category) => category.items.length);

  const popularItems = activeCategories
    .flatMap((category) => category.items)
    .filter((item) => POPULAR_TOOLS.includes(item.path));

  const securityItems = activeCategories.find((category) => category.category === 'PDF Security')?.items || [];

  return (
    <Menubar className="app-menubar desktop-only">
      <MenubarMenu>
        <MenubarTrigger className="gap-2">
          <FolderOpen className="h-4 w-4" />
          Tools
        </MenubarTrigger>
        <MenubarContent className="w-72">
          <MenubarLabel>Popular tools</MenubarLabel>
          {popularItems.map((item) => (
            <MenubarItem key={item.path} asChild className={activePath === item.path ? 'app-menubar-item-active' : ''}>
              <Link to={item.path} onClick={onNavigate} className="flex items-center gap-2">
                <span className="app-menubar-emoji">{item.icon}</span>
                <span>{item.name}</span>
              </Link>
            </MenubarItem>
          ))}
          <MenubarSeparator />
          <MenubarItem asChild>
            <Link to="/tools" onClick={onNavigate} className="flex items-center gap-2 font-semibold">
              <Sparkles className="h-4 w-4" />
              Browse all tools
            </Link>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="gap-2">
          <ArrowLeftRight className="h-4 w-4" />
          Categories
        </MenubarTrigger>
        <MenubarContent className="w-64">
          {activeCategories.map((category) => {
            const Icon = CATEGORY_ICONS[category.category] || FileText;
            return (
              <MenubarSub key={category.category}>
                <MenubarSubTrigger className="gap-2">
                  <Icon className="h-4 w-4" />
                  {category.category}
                </MenubarSubTrigger>
                <MenubarSubContent className="w-64">
                  {category.items.map((item) => (
                    <MenubarItem key={item.path} asChild className={activePath === item.path ? 'app-menubar-item-active' : ''}>
                      <Link to={item.path} onClick={onNavigate} className="flex items-center gap-2">
                        <span className="app-menubar-emoji">{item.icon}</span>
                        <span>{item.name}</span>
                        {item.isNew && <span className="badge badge-new" style={{ marginLeft: 'auto' }}>New</span>}
                      </Link>
                    </MenubarItem>
                  ))}
                </MenubarSubContent>
              </MenubarSub>
            );
          })}
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="gap-2">
          <Shield className="h-4 w-4" />
          Security
        </MenubarTrigger>
        <MenubarContent className="w-64">
          {securityItems.map((item) => (
            <MenubarItem key={item.path} asChild className={activePath === item.path ? 'app-menubar-item-active' : ''}>
              <Link to={item.path} onClick={onNavigate} className="flex items-center gap-2">
                <Lock className="h-4 w-4" />
                <span>{item.name}</span>
                {item.isNew && <span className="badge badge-new" style={{ marginLeft: 'auto' }}>New</span>}
              </Link>
            </MenubarItem>
          ))}
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger className="gap-2">
          <Info className="h-4 w-4" />
          Company
        </MenubarTrigger>
        <MenubarContent className="w-52">
          <MenubarItem asChild className={activePath === '/about' ? 'app-menubar-item-active' : ''}>
            <Link to="/about" onClick={onNavigate} className="flex items-center gap-2">
              <Info className="h-4 w-4" />
              About
            </Link>
          </MenubarItem>
          <MenubarItem asChild className={activePath === '/privacy' ? 'app-menubar-item-active' : ''}>
            <Link to="/privacy" onClick={onNavigate} className="flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Privacy
            </Link>
          </MenubarItem>
          <MenubarSeparator />
          <MenubarItem asChild className={activePath === '/contact' ? 'app-menubar-item-active' : ''}>
            <Link to="/contact" onClick={onNavigate} className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              Contact
            </Link>
          </MenubarItem>
        </MenubarContent>
      </MenubarMenu>

      <MenubarMenu>
        <MenubarTrigger asChild>
          <Link to="/tools" onClick={onNavigate} className="flex items-center gap-2 px-3 py-1.5 text-sm font-medium">
            Launch
            <ChevronRight className="h-4 w-4" />
          </Link>
        </MenubarTrigger>
      </MenubarMenu>
    </Menubar>
  );
};

export default AppMenuBar;
