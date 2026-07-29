import { useState, useRef, useEffect, useMemo } from "react";
import Icon from "./Icon";
import { useClickOutside } from "../hooks/useClickOutside";
import styles from "./SearchablePopover.module.css";

export interface PopoverOption {
  value: string;
  label: string;
  description?: string;
  icon?: string;
  color?: string; // hex or color keyword for status dot
}

interface SearchablePopoverProps {
  options: PopoverOption[];
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function SearchablePopover({
  options,
  value,
  onChange,
  placeholder = "Select option",
  searchPlaceholder = "Search...",
  disabled = false,
  loading = false,
}: SearchablePopoverProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [focusedIndex, setFocusedIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Close when clicking outside using click outside hook
  useClickOutside(containerRef, () => setIsOpen(false), isOpen);

  // Memoize filtered options
  const filteredOptions = useMemo(() => {
    return options.filter((opt) =>
      opt.label.toLowerCase().includes(search.toLowerCase())
    );
  }, [options, search]);

  // Hide search input if options count is less than 8
  const showSearch = options.length >= 8;

  // Sync focused index and focus input on open
  useEffect(() => {
    if (isOpen) {
      const initialIndex = filteredOptions.findIndex((opt) => opt.value === value);
      setFocusedIndex(initialIndex >= 0 ? initialIndex : 0);
      if (showSearch) {
        // Delay slightly to ensure input is mounted
        setTimeout(() => inputRef.current?.focus(), 10);
      }
    } else {
      setFocusedIndex(-1);
    }
  }, [isOpen, value, filteredOptions, showSearch]);

  // Reset search when closed
  useEffect(() => {
    if (!isOpen) {
      setSearch("");
    }
  }, [isOpen]);

  // Scroll focused option into view dynamically
  useEffect(() => {
    if (focusedIndex >= 0 && listRef.current) {
      const listEl = listRef.current;
      const focusedEl = listEl.children[focusedIndex] as HTMLElement;
      if (focusedEl) {
        const listHeight = listEl.clientHeight;
        const focusedTop = focusedEl.offsetTop;
        const focusedHeight = focusedEl.clientHeight;

        if (focusedTop + focusedHeight > listEl.scrollTop + listHeight) {
          listEl.scrollTop = focusedTop + focusedHeight - listHeight;
        } else if (focusedTop < listEl.scrollTop) {
          listEl.scrollTop = focusedTop;
        }
      }
    }
  }, [focusedIndex]);

  const selectedOption = options.find((opt) => opt.value === value);

  // Key handlers
  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (disabled || loading) return;

    switch (e.key) {
      case "Escape":
        if (isOpen) {
          setIsOpen(false);
          triggerRef.current?.focus();
          e.preventDefault();
          e.stopPropagation();
        }
        break;

      case "ArrowDown":
        if (!isOpen) {
          setIsOpen(true);
        } else if (filteredOptions.length > 0) {
          setFocusedIndex((prev) => (prev + 1) % filteredOptions.length);
        }
        e.preventDefault();
        break;

      case "ArrowUp":
        if (isOpen && filteredOptions.length > 0) {
          setFocusedIndex((prev) => (prev - 1 + filteredOptions.length) % filteredOptions.length);
        }
        e.preventDefault();
        break;

      case "Enter":
        if (isOpen) {
          if (focusedIndex >= 0 && focusedIndex < filteredOptions.length) {
            onChange(filteredOptions[focusedIndex].value);
            setIsOpen(false);
            triggerRef.current?.focus();
            e.preventDefault();
          }
        } else {
          setIsOpen(true);
          e.preventDefault();
        }
        break;

      default:
        break;
    }
  };

  return (
    <div
      ref={containerRef}
      className={styles.container}
      onKeyDown={handleKeyDown}
    >
      {/* Trigger Button */}
      <button
        ref={triggerRef}
        type="button"
        disabled={disabled || loading}
        onClick={() => setIsOpen(!isOpen)}
        className={`${styles.trigger} ${
          disabled || loading ? styles.triggerDisabled : styles.triggerEnabled
        }`}
      >
        <span className={styles.labelWrapper}>
          {loading && <span className={styles.spinner} />}
          {!loading && selectedOption?.color && (
            <span
              className={styles.colorDot}
              style={{ backgroundColor: selectedOption.color }}
            />
          )}
          {!loading && selectedOption?.icon && (
            <Icon name={selectedOption.icon} style={{ fontSize: "14px" }} />
          )}
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </span>
        <Icon
          name="arrow_drop_down"
          style={{
            fontSize: "16px",
            color: "var(--muted)",
            transform: isOpen ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s ease",
          }}
        />
      </button>

      {/* Floating Popover Menu */}
      {isOpen && (
        <div className={styles.menu}>
          {/* Search Box */}
          {showSearch && (
            <div className={styles.searchBox}>
              <Icon name="search" style={{ fontSize: "14px", color: "var(--muted)" }} />
              <input
                ref={inputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder={searchPlaceholder}
                className={styles.searchInput}
              />
            </div>
          )}

          {/* Options List */}
          <div ref={listRef} className={styles.optionsList}>
            {filteredOptions.length === 0 ? (
              <div className={styles.emptyMsg}>No options found</div>
            ) : (
              filteredOptions.map((opt, index) => {
                const isSelected = opt.value === value;
                const isFocused = index === focusedIndex;

                return (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => {
                      onChange(opt.value);
                      setIsOpen(false);
                      triggerRef.current?.focus();
                    }}
                    className={`${styles.optionItem} ${
                      isFocused ? styles.optionItemHovered : ""
                    } ${isSelected ? styles.optionItemSelected : ""}`}
                  >
                    <span className={styles.optionLeft}>
                      {opt.color && (
                        <span
                          className={styles.colorDot}
                          style={{ backgroundColor: opt.color }}
                        />
                      )}
                      {opt.icon && <Icon name={opt.icon} style={{ fontSize: "14px" }} />}
                      <span className={styles.optionText}>
                        <span
                          className={`${styles.optionLabel} ${
                            isSelected ? styles.optionLabelSelected : ""
                          }`}
                        >
                          {opt.label}
                        </span>
                        {opt.description && (
                          <span className={styles.optionDescription}>
                            {opt.description}
                          </span>
                        )}
                      </span>
                    </span>
                    {isSelected && (
                      <Icon
                        name="check"
                        style={{
                          fontSize: "14px",
                          color: "var(--primary)",
                          fontWeight: "bold",
                        }}
                      />
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
