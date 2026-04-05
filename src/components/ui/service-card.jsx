import * as React from "react";
import { cva } from "class-variance-authority";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "../../lib/utils";

// CVA for card variants
const cardVariants = cva(
  "relative flex flex-col justify-between w-full p-6 overflow-hidden rounded-xl shadow-sm transition-shadow duration-300 ease-in-out group hover:shadow-lg h-full",
  {
    variants: {
      variant: {
        default: "bg-card text-card-foreground border border-border",
        red: "bg-red-500/90 text-white",
        blue: "bg-blue-500/90 text-white",
        gray: "bg-zinc-800/90 text-white",
        primary: "bg-primary/90 text-white",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

/**
 * ServiceCard Component
 * 
 * @param {Object} props
 * @param {string} props.title - The title of the tool
 * @param {string} props.href - The path to the tool
 * @param {string} props.imgSrc - The decorative background image
 * @param {string} props.imgAlt - Alt text for the image
 * @param {string} props.variant - Background variant
 * @param {string} props.description - Description text
 * @param {boolean} props.isNew - Badge indicator
 */
const ServiceCard = React.forwardRef(
  ({ className, variant, title, href, imgSrc, imgAlt, description, isNew, ...props }, ref) => {
    
    // Animation variants for Framer Motion
    const cardAnimation = {
      hover: {
        scale: 1.02,
        transition: { duration: 0.3 },
      },
    };

    const imageAnimation = {
      hover: {
        scale: 1.15,
        rotate: 5,
        x: 15,
        transition: { duration: 0.4, ease: "easeInOut" },
      },
    };
    
    const arrowAnimation = {
        hover: {
            x: 5,
            transition: { duration: 0.3, ease: "easeInOut", repeat: Infinity, repeatType: "reverse" },
        }
    };

    return (
      <Link to={href} className="block no-underline h-full">
        <motion.div
          className={cn(cardVariants({ variant, className }))}
          ref={ref}
          variants={cardAnimation}
          whileHover="hover"
          {...props}
        >
          <div className="relative z-10 flex flex-col h-full items-start">
            <h3 className="text-xl font-bold tracking-tight mb-2 leading-tight">
              {title}
              {isNew && (
                <span className="ml-2 inline-block bg-white/20 backdrop-blur-md text-white text-[10px] px-1.5 py-0.5 rounded font-bold uppercase tracking-tighter align-middle">New</span>
              )}
            </h3>
            <p className="text-sm opacity-80 line-clamp-2 mb-4 leading-relaxed max-w-[80%]">
              {description}
            </p>
            <div
              className="mt-auto flex items-center text-xs font-bold tracking-widest uppercase group-hover:underline"
            >
              USE TOOL
              <motion.div variants={arrowAnimation}>
                  <ArrowRight className="ml-2 h-4 w-4" />
              </motion.div>
            </div>
          </div>
          
          <motion.img
            src={imgSrc}
            alt={imgAlt}
            className="absolute -right-6 -bottom-6 w-36 h-36 object-contain opacity-30 group-hover:opacity-50 blur-[2px] group-hover:blur-0"
            variants={imageAnimation}
          />
        </motion.div>
      </Link>
    );
  }
);
ServiceCard.displayName = "ServiceCard";

export { ServiceCard };
