import * as React from 'react';
import { createContext, useContext } from 'react';
import { cn } from '../../lib/utils';

const StepperContext = createContext(undefined);
const StepItemContext = createContext(undefined);

export function useStepper() {
  const ctx = useContext(StepperContext);
  if (!ctx) throw new Error('useStepper must be used within a Stepper');
  return ctx;
}

export function useStepItem() {
  const ctx = useContext(StepItemContext);
  if (!ctx) throw new Error('useStepItem must be used within a StepperItem');
  return ctx;
}

export function Stepper({
  defaultValue = 1,
  value,
  onValueChange,
  orientation = 'horizontal',
  className,
  children,
  indicators = {},
  ...props
}) {
  const [activeStep, setActiveStep] = React.useState(defaultValue);
  const [triggerNodes, setTriggerNodes] = React.useState([]);

  const registerTrigger = React.useCallback((node) => {
    setTriggerNodes((prev) => {
      if (node && !prev.includes(node)) return [...prev, node];
      if (!node && prev.includes(node)) return prev.filter((n) => n !== node);
      return prev;
    });
  }, []);

  const handleSetActiveStep = React.useCallback(
    (step) => {
      if (value === undefined) setActiveStep(step);
      onValueChange?.(step);
    },
    [value, onValueChange],
  );

  const currentStep = value ?? activeStep;

  const focusTrigger = (idx) => triggerNodes[idx]?.focus();
  const focusNext = (currentIdx) => focusTrigger((currentIdx + 1) % triggerNodes.length);
  const focusPrev = (currentIdx) => focusTrigger((currentIdx - 1 + triggerNodes.length) % triggerNodes.length);
  const focusFirst = () => focusTrigger(0);
  const focusLast = () => focusTrigger(triggerNodes.length - 1);

  const contextValue = React.useMemo(
    () => ({
      activeStep: currentStep,
      setActiveStep: handleSetActiveStep,
      stepsCount: React.Children.toArray(children).filter(
        (child) => React.isValidElement(child) && child.type?.displayName === 'StepperItem'
      ).length,
      orientation,
      registerTrigger,
      focusNext,
      focusPrev,
      focusFirst,
      focusLast,
      triggerNodes,
      indicators,
    }),
    [currentStep, handleSetActiveStep, children, orientation, registerTrigger, triggerNodes, indicators],
  );

  return (
    <StepperContext.Provider value={contextValue}>
      <div
        role="tablist"
        aria-orientation={orientation}
        data-slot="stepper"
        className={cn('w-full', className)}
        data-orientation={orientation}
        {...props}
      >
        {children}
      </div>
    </StepperContext.Provider>
  );
}

export function StepperItem({
  step,
  completed = false,
  disabled = false,
  loading = false,
  className,
  children,
  ...props
}) {
  const { activeStep } = useStepper();
  const state = completed || step < activeStep ? 'completed' : activeStep === step ? 'active' : 'inactive';
  const isLoading = loading && step === activeStep;

  return (
    <StepItemContext.Provider value={{ step, state, isDisabled: disabled, isLoading }}>
      <div
        data-slot="stepper-item"
        className={cn(
          'group/step flex items-center justify-center group-data-[orientation=horizontal]/stepper-nav:flex-row group-data-[orientation=vertical]/stepper-nav:flex-col [&:not(:last-child)]:flex-1',
          className,
        )}
        data-state={state}
        {...(isLoading ? { 'data-loading': true } : {})}
        {...props}
      >
        {children}
      </div>
    </StepItemContext.Provider>
  );
}
StepperItem.displayName = 'StepperItem';

export function StepperTrigger({ asChild = false, className, children, tabIndex, ...props }) {
  const { state, isLoading, step, isDisabled } = useStepItem();
  const { setActiveStep, activeStep, registerTrigger, triggerNodes, focusNext, focusPrev, focusFirst, focusLast } = useStepper();
  
  const isSelected = activeStep === step;
  const id = \`stepper-tab-\${step}\`;
  const panelId = \`stepper-panel-\${step}\`;

  const btnRef = React.useRef(null);
  React.useEffect(() => {
    if (btnRef.current) registerTrigger(btnRef.current);
  }, [registerTrigger]);

  const myIdx = React.useMemo(
    () => triggerNodes.findIndex((n) => n === btnRef.current),
    [triggerNodes]
  );

  const handleKeyDown = (e) => {
    switch (e.key) {
      case 'ArrowRight': case 'ArrowDown':
        e.preventDefault();
        if (myIdx !== -1) focusNext(myIdx);
        break;
      case 'ArrowLeft': case 'ArrowUp':
        e.preventDefault();
        if (myIdx !== -1) focusPrev(myIdx);
        break;
      case 'Home':
        e.preventDefault();
        focusFirst();
        break;
      case 'End':
        e.preventDefault();
        focusLast();
        break;
      case 'Enter': case ' ':
        e.preventDefault();
        setActiveStep(step);
        break;
    }
  };

  if (asChild) {
    return (
      <span data-slot="stepper-trigger" data-state={state} className={className}>
        {children}
      </span>
    );
  }

  return (
    <button
      ref={btnRef}
      role="tab"
      id={id}
      aria-selected={isSelected}
      aria-controls={panelId}
      tabIndex={typeof tabIndex === 'number' ? tabIndex : isSelected ? 0 : -1}
      data-slot="stepper-trigger"
      data-state={state}
      data-loading={isLoading}
      className={cn(
        'cursor-pointer focus-visible:border-ring focus-visible:ring-ring/50 inline-flex items-center gap-3 rounded-full outline-none focus-visible:z-10 focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-60',
        className,
      )}
      onClick={() => setActiveStep(step)}
      onKeyDown={handleKeyDown}
      disabled={isDisabled}
      {...props}
    >
      {children}
    </button>
  );
}

export function StepperIndicator({ children, className }) {
  const { state, isLoading } = useStepItem();
  const { indicators } = useStepper();

  const isCompleted = state === 'completed';
  const isActive = state === 'active';

  return (
    <div
      data-slot="stepper-indicator"
      data-state={state}
      className={cn(
        'relative flex items-center overflow-hidden justify-center size-8 shrink-0 border-2 border-slate-200 dark:border-slate-700 bg-slate-100 dark:bg-slate-800 text-slate-500 rounded-full text-xs font-bold transition-colors',
        isCompleted && 'bg-primary border-primary text-white',
        isActive && 'border-primary text-primary',
        className,
      )}
    >
      <div className="absolute flex items-center justify-center">
        {indicators &&
        ((isLoading && indicators.loading) ||
          (isCompleted && indicators.completed) ||
          (isActive && indicators.active) ||
          (state === 'inactive' && indicators.inactive))
          ? (isLoading && indicators.loading) ||
            (isCompleted && indicators.completed) ||
            (isActive && indicators.active) ||
            (state === 'inactive' && indicators.inactive)
          : children}
      </div>
    </div>
  );
}

export function StepperSeparator({ className }) {
  const { state } = useStepItem();

  return (
    <div
      data-slot="stepper-separator"
      data-state={state}
      className={cn(
        'm-0.5 rounded-full bg-slate-200 dark:bg-slate-700 transition-colors duration-300',
        'group-data-[orientation=vertical]/stepper-nav:h-12 group-data-[orientation=vertical]/stepper-nav:w-1 group-data-[orientation=horizontal]/stepper-nav:h-1 group-data-[orientation=horizontal]/stepper-nav:flex-1',
        state === 'completed' && 'bg-primary',
        className,
      )}
    />
  );
}

export function StepperTitle({ children, className }) {
  const { state } = useStepItem();
  return (
    <h3 data-slot="stepper-title" data-state={state} className={cn('text-sm font-bold leading-none', className)}>
      {children}
    </h3>
  );
}

export function StepperDescription({ children, className }) {
  const { state } = useStepItem();
  return (
    <div data-slot="stepper-description" data-state={state} className={cn('text-sm text-slate-500 dark:text-slate-400', className)}>
      {children}
    </div>
  );
}

export function StepperNav({ children, className }) {
  const { activeStep, orientation } = useStepper();
  return (
    <nav
      data-slot="stepper-nav"
      data-state={activeStep}
      data-orientation={orientation}
      className={cn(
        'group/stepper-nav inline-flex data-[orientation=horizontal]:w-full data-[orientation=horizontal]:flex-row data-[orientation=vertical]:flex-col',
        className,
      )}
    >
      {children}
    </nav>
  );
}

export function StepperPanel({ children, className }) {
  const { activeStep } = useStepper();
  return (
    <div data-slot="stepper-panel" data-state={activeStep} className={cn('w-full', className)}>
      {children}
    </div>
  );
}

export function StepperContent({ value, forceMount, children, className }) {
  const { activeStep } = useStepper();
  const isActive = value === activeStep;

  if (!forceMount && !isActive) return null;

  return (
    <div
      data-slot="stepper-content"
      data-state={activeStep}
      className={cn('w-full fade-in', className, !isActive && forceMount && 'hidden')}
      hidden={!isActive && forceMount}
    >
      {children}
    </div>
  );
}
