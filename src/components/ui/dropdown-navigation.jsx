import { useState } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * DropdownNavigation Component
 * 
 * @param {Object} props
 * @param {Array} props.navItems - Array of navigation items
 * @param {Function} [props.onNavItemClick] - Optional callback when a nav item or sub-item is clicked
 */
export function DropdownNavigation({ navItems, onNavItemClick }) {
  const [openMenu, setOpenMenu] = React.useState(null);

  const handleHover = (menuLabel) => {
    setOpenMenu(menuLabel);
  };

  const [isHover, setIsHover] = useState(null);

  return (
    <ul className="relative flex items-center space-x-1">
      {navItems.map((navItem) => (
        <li
          key={navItem.label}
          className="relative"
          onMouseEnter={() => handleHover(navItem.label)}
          onMouseLeave={() => handleHover(null)}
        >
          {navItem.link ? (
            <Link
              to={navItem.link}
              className="text-sm font-medium py-1.5 px-4 flex cursor-pointer group transition-colors duration-300 items-center justify-center gap-1 text-muted-foreground hover:text-foreground relative rounded-full"
              onMouseEnter={() => setIsHover(navItem.id)}
              onMouseLeave={() => setIsHover(null)}
              onClick={onNavItemClick}
            >
              <span>{navItem.label}</span>
              {(isHover === navItem.id || openMenu === navItem.label) && (
                <motion.div
                  layoutId="hover-bg"
                  className="absolute inset-0 size-full bg-primary/10"
                  style={{ borderRadius: 99 }}
                />
              )}
            </Link>
          ) : (
            <button
              className="text-sm font-medium py-1.5 px-4 flex cursor-pointer group transition-colors duration-300 items-center justify-center gap-1 text-muted-foreground hover:text-foreground relative rounded-full"
              onMouseEnter={() => setIsHover(navItem.id)}
              onMouseLeave={() => setIsHover(null)}
            >
              <span>{navItem.label}</span>
              {navItem.subMenus && (
                <ChevronDown
                  className={`h-4 w-4 group-hover:rotate-180 duration-300 transition-transform
                    ${openMenu === navItem.label ? "rotate-180" : ""}`}
                />
              )}
              {(isHover === navItem.id || openMenu === navItem.label) && (
                <motion.div
                  layoutId="hover-bg"
                  className="absolute inset-0 size-full bg-primary/10"
                  style={{ borderRadius: 99 }}
                />
              )}
            </button>
          )}

          <AnimatePresence>
            {openMenu === navItem.label && navItem.subMenus && (
              <div className="w-auto absolute left-0 top-full pt-2 z-50">
                <motion.div
                  className="bg-background border border-border p-5 w-max shadow-xl"
                  style={{ borderRadius: 16 }}
                  layoutId="menu"
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                >
                  <div className="w-fit shrink-0 flex space-x-9 overflow-hidden">
                    {navItem.subMenus.map((sub) => (
                      <motion.div layout className="w-full" key={sub.title}>
                        <h3 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                          {sub.title}
                        </h3>
                        <ul className="space-y-5">
                          {sub.items.map((item) => {
                            const Icon = item.icon;
                            return (
                              <li key={item.label}>
                                <Link
                                  to={item.path || "#"}
                                  className="flex items-start space-x-3 group"
                                  onClick={() => {
                                    handleHover(null);
                                    if (onNavItemClick) onNavItemClick();
                                  }}
                                >
                                  <div className="border border-border text-foreground rounded-lg flex items-center justify-center size-9 shrink-0 group-hover:bg-primary/10 group-hover:text-primary group-hover:border-primary/20 transition-all duration-300">
                                    {typeof Icon === 'string' ? (
                                      <span className="text-lg">{Icon}</span>
                                    ) : (
                                      <Icon className="h-5 w-5 flex-none" />
                                    )}
                                  </div>
                                  <div className="leading-tight w-max max-w-[200px]">
                                    <p className="text-sm font-semibold text-foreground shrink-0 flex items-center gap-1.5">
                                      {item.label}
                                      {item.isNew && (
                                        <span className="bg-primary/20 text-primary text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter">New</span>
                                      )}
                                    </p>
                                    <p className="text-xs text-muted-foreground shrink-0 group-hover:text-foreground/80 transition-colors duration-300 mt-0.5 leading-normal">
                                      {item.description}
                                    </p>
                                  </div>
                                </Link>
                              </li>
                            );
                          })}
                        </ul>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>
        </li>
      ))}
    </ul>
  );
}
