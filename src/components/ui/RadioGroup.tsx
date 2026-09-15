"use client";

import { useEffect, useRef, type KeyboardEvent, type ReactNode } from "react";

interface RadioGroupProps {
  children: ReactNode;
  className?: string;
  /** One of these is required, like any labelled group. */
  label?: string;
  labelledBy?: string;
}

/**
 * A radio group that behaves like one on a keyboard.
 *
 * The app styles its options as buttons with `role="radio"`, which looks right
 * but, left alone, ignores the arrow keys and puts every option in the tab
 * order. This wrapper implements the ARIA radio pattern over whatever children
 * it is given: arrows (and Home/End) move between options, selection follows
 * focus, and only the selected option is tabbable, so Tab leaves the group
 * instead of walking through ten of them.
 */
export function RadioGroup({ children, className, label, labelledBy }: RadioGroupProps) {
  const ref = useRef<HTMLDivElement>(null);

  // Roving tabindex, applied after every render because the checked option
  // changes as the parent re-renders.
  useEffect(() => {
    const radios = radioElements(ref.current);
    if (radios.length === 0) return;
    const checked = radios.find((radio) => radio.getAttribute("aria-checked") === "true");
    for (const radio of radios) {
      radio.tabIndex = radio === (checked ?? radios[0]) ? 0 : -1;
    }
  });

  function onKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    const keys = ["ArrowRight", "ArrowDown", "ArrowLeft", "ArrowUp", "Home", "End"];
    if (!keys.includes(event.key)) return;
    const radios = radioElements(ref.current);
    if (radios.length === 0) return;
    event.preventDefault();

    const current = radios.indexOf(document.activeElement as HTMLElement);
    let next: number;
    if (event.key === "Home") next = 0;
    else if (event.key === "End") next = radios.length - 1;
    else if (event.key === "ArrowRight" || event.key === "ArrowDown")
      next = current < 0 ? 0 : (current + 1) % radios.length;
    else next = current < 0 ? radios.length - 1 : (current - 1 + radios.length) % radios.length;

    const target = radios[next];
    target.focus();
    // Selection follows focus, except when there is nowhere to move: clicking
    // the option you are already on would toggle it off in some groups.
    if (target !== radios[current]) target.click();
  }

  return (
    <div
      ref={ref}
      role="radiogroup"
      aria-label={label}
      aria-labelledby={labelledBy}
      onKeyDown={onKeyDown}
      className={className}
    >
      {children}
    </div>
  );
}

function radioElements(root: HTMLElement | null): HTMLElement[] {
  if (!root) return [];
  return Array.from(root.querySelectorAll<HTMLElement>('[role="radio"]')).filter(
    (element) => !element.hasAttribute("disabled"),
  );
}
