// AlignUI MultiSelect v0.0.0

'use client';

import * as ScrollAreaPrimitives from '@radix-ui/react-scroll-area';
import {
  RiArrowDownSLine,
  RiCheckLine,
  RiCloseLine,
  RiSearchLine,
} from '@remixicon/react';
import * as React from 'react';

import { cn } from 'src/utils/cn';
import { tv, type VariantProps } from 'src/utils/tv';

import type { PolymorphicComponentProps } from 'src/utils/polymorphic';

export const multiSelectVariants = tv({
  slots: {
    triggerRoot: [
      // base
      'group/trigger bg-bg-white-0 shadow-regular-xs relative min-w-0 shrink-0 outline-none',
      'text-paragraph-sm text-text-strong-950',
      'flex items-center text-left',
      'transition duration-200 ease-out',
      'before:pointer-events-none before:absolute before:inset-0 before:rounded-[inherit] before:ring-1 before:transition before:duration-200 before:ease-out before:ring-inset',
      'before:ring-stroke-soft-200',
      // hover
      'hover:bg-bg-weak-50 hover:before:ring-transparent',
      // focus
      'focus:shadow-button-important-focus focus:before:ring-stroke-strong-950 focus:outline-none',
      'focus:text-text-strong-950 data-placeholder:focus:text-text-strong-950',
      // disabled
      'disabled:bg-bg-weak-50 disabled:text-text-disabled-300 data-placeholder:disabled:text-text-disabled-300 disabled:pointer-events-none disabled:shadow-none disabled:before:ring-transparent',
      // placeholder state
      'data-placeholder:text-text-sub-600',
      // open state
      'data-[state=open]:before:ring-stroke-strong-950',
    ],
    triggerArrow: [
      // base
      'ml-auto size-5 shrink-0',
      'transition duration-200 ease-out',
      // placeholder state
      'group-data-placeholder/trigger:text-text-soft-400',
      // filled state
      'text-text-sub-600',
      // hover
      'group-hover/trigger:text-text-sub-600 group-data-placeholder/trigger:group-hover:text-text-sub-600',
      // focus
      'group-focus/trigger:text-text-strong-950 group-data-placeholder/trigger:group-focus/trigger:text-text-strong-950',
      // disabled
      'group-disabled/trigger:text-text-disabled-300 group-data-placeholder/trigger:group-disabled/trigger:text-text-disabled-300',
      // open
      'group-data-[state=open]/trigger:rotate-180',
    ],
    triggerIcon: [
      // base
      'text-text-sub-600 h-5 w-auto min-w-0 shrink-0 object-contain',
      'transition duration-200 ease-out',
      // placeholder state
      'group-data-placeholder/trigger:text-text-soft-400',
      // hover
      'group-hover/trigger:text-text-sub-600 group-data-placeholder/trigger:group-hover:text-text-sub-600',
      // disabled
      'group-disabled/trigger:text-text-disabled-300 group-data-placeholder/trigger:group-disabled/trigger:text-text-disabled-300',
      'group-disabled/trigger:[&:not(.remixicon)]:opacity-[.48]',
    ],
    tagsContainer: ['flex min-w-0 flex-1 flex-wrap gap-1'],
    tag: [
      'bg-bg-weak-50 text-text-strong-950 inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium',
      'transition duration-200 ease-out',
      'hover:bg-bg-sub-100',
    ],
    tagRemove: [
      'text-text-sub-600 size-3 shrink-0 cursor-pointer',
      'transition duration-200 ease-out',
      'hover:text-text-strong-950',
    ],
    placeholder: ['text-text-sub-600 truncate'],
    searchInput: [
      'min-w-0 flex-1 border-none bg-transparent outline-none',
      'text-paragraph-sm text-text-strong-950',
      'placeholder:text-text-sub-600',
    ],
    itemIcon: [
      'text-text-sub-600 size-5 shrink-0 bg-size-[1.25rem]',
      // disabled
      'in-data-disabled:text-text-disabled-300 [[data-disabled]_&:not(.remixicon)]:opacity-[.48]',
    ],
  },
  variants: {
    size: {
      medium: {},
      small: {},
      xsmall: {},
    },
    variant: {
      default: {
        triggerRoot: 'w-full',
      },
      compact: {
        triggerRoot: 'w-auto',
      },
    },
    hasError: {
      true: {
        triggerRoot: [
          // base
          'before:ring-error-base',
          // focus
          'focus:shadow-button-error-focus focus:before:ring-error-base',
        ],
      },
    },
  },
  compoundVariants: [
    //#region default
    {
      size: 'medium',
      variant: 'default',
      class: {
        triggerRoot: 'rounded-10 min-h-10 gap-2 py-2 pr-2.5 pl-3',
      },
    },
    {
      size: 'small',
      variant: 'default',
      class: {
        triggerRoot: 'min-h-9 gap-2 rounded-lg py-1.5 pr-2 pl-2.5',
      },
    },
    {
      size: 'xsmall',
      variant: 'default',
      class: {
        triggerRoot: 'min-h-8 gap-1.5 rounded-lg py-1 pr-1.5 pl-2',
      },
    },
    //#endregion

    //#region compact
    {
      size: 'medium',
      variant: 'compact',
      class: {
        triggerRoot: 'rounded-10 min-h-10 gap-1 py-2 pr-2.5 pl-3',
        triggerIcon: '-ml-0.5',
        itemIcon: 'group-has-[&]/trigger:-ml-0.5',
      },
    },
    {
      size: 'small',
      variant: 'compact',
      class: {
        triggerRoot: 'min-h-9 gap-1 rounded-lg py-1.5 pr-2 pl-3',
        triggerIcon: '-ml-0.5',
        itemIcon: 'group-has-[&]/trigger:-ml-0.5',
      },
    },
    {
      size: 'xsmall',
      variant: 'compact',
      class: {
        triggerRoot: 'min-h-8 gap-0.5 rounded-lg py-1 pr-1.5 pl-2.5',
        triggerIcon: '-ml-0.5 size-4',
        itemIcon: 'size-4 bg-size-[1rem] group-has-[&]/trigger:-ml-0.5',
      },
    },
    //#endregion
  ],
  defaultVariants: {
    variant: 'default',
    size: 'medium',
  },
});

interface MultiSelectOption<T = string> {
  value: T;
  label: string;
  disabled?: boolean;
}

type MultiSelectContextType<T = string> = Pick<
  VariantProps<typeof multiSelectVariants>,
  'variant' | 'size' | 'hasError'
> & {
  options: MultiSelectOption<T>[];
  selectedValues: T[];
  onSelectionChange: (values: T[]) => void;
  searchValue: string;
  onSearchChange: (value: string) => void;
  placeholder?: string;
  searchPlaceholder?: string;
  disabled?: boolean;
  name?: string;
};

const MultiSelectContext =
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  React.createContext<MultiSelectContextType<any> | null>(null);

const useMultiSelectContext = <T = string,>() => {
  const context = React.useContext(
    MultiSelectContext,
  ) as MultiSelectContextType<T> | null;
  if (!context) {
    throw new Error(
      'MultiSelect components must be used within MultiSelectRoot',
    );
  }
  return context;
};

interface MultiSelectRootProps<T = string>
  extends Omit<
      React.HTMLAttributes<HTMLDivElement>,
      'onSelect' | 'defaultValue'
    >,
    Pick<
      MultiSelectContextType<T>,
      | 'variant'
      | 'size'
      | 'hasError'
      | 'options'
      | 'placeholder'
      | 'searchPlaceholder'
      | 'disabled'
      | 'name'
    > {
  value?: T[];
  defaultValue?: T[];
  onValueChange?: (values: T[]) => void;
}

const MultiSelectRoot = <T = string,>(
  {
    size = 'medium',
    variant = 'default',
    hasError = false,
    options = [],
    value,
    defaultValue = [],
    onValueChange,
    placeholder = 'Select options...',
    searchPlaceholder = 'Search options...',
    disabled = false,
    name,
    className,
    ...rest
  }: MultiSelectRootProps<T>,
  forwardedRef: React.ForwardedRef<HTMLDivElement>,
) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const [selectedValues, setSelectedValues] = React.useState<T[]>(
    value || defaultValue,
  );
  const [searchValue, setSearchValue] = React.useState('');

  const handleSelectionChange = React.useCallback(
    (newValues: T[]) => {
      if (!disabled) {
        setSelectedValues(newValues);
        onValueChange?.(newValues);
      }
    },
    [disabled, onValueChange],
  );

  const handleSearchChange = React.useCallback((newSearchValue: string) => {
    setSearchValue(newSearchValue);
  }, []);

  // Update internal state when controlled value changes
  React.useEffect(() => {
    if (value !== undefined) {
      setSelectedValues(value);
    }
  }, [value]);

  const contextValue: MultiSelectContextType<T> = {
    size,
    variant,
    hasError,
    options,
    selectedValues,
    onSelectionChange: handleSelectionChange,
    searchValue,
    onSearchChange: handleSearchChange,
    placeholder,
    searchPlaceholder,
    disabled,
    name,
  };

  return (
    <MultiSelectContext.Provider value={contextValue}>
      <div
        ref={forwardedRef}
        className={cn('relative', className)}
        data-state={isOpen ? 'open' : 'closed'}
        {...rest}
      >
        <MultiSelectTrigger onClick={() => !disabled && setIsOpen(!isOpen)} />
        {isOpen && <MultiSelectContent onClose={() => setIsOpen(false)} />}
        {/* Hidden inputs for form submission */}
        {name &&
          selectedValues.map((value, index) => (
            <input
              key={`${String(value)}-${index}`}
              type='hidden'
              name={name}
              value={String(value)}
            />
          ))}
      </div>
    </MultiSelectContext.Provider>
  );
};

const MultiSelectRootForwarded = React.forwardRef(MultiSelectRoot) as <
  T = string,
>(
  props: MultiSelectRootProps<T> & { ref?: React.ForwardedRef<HTMLDivElement> },
) => ReturnType<typeof MultiSelectRoot>;

MultiSelectRoot.displayName = 'MultiSelectRoot';

interface MultiSelectTriggerProps
  extends React.HTMLAttributes<HTMLButtonElement> {
  asChild?: boolean;
}

const MultiSelectTrigger = React.forwardRef<
  HTMLButtonElement,
  MultiSelectTriggerProps
>(({ className, onClick, ...rest }, forwardedRef) => {
  const { size, variant, hasError, selectedValues, options, disabled } =
    useMultiSelectContext();

  const { triggerRoot, triggerArrow } = multiSelectVariants({
    size,
    variant,
    hasError,
  });

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value),
  );
  const hasSelection = selectedOptions.length > 0;

  return (
    <button
      ref={forwardedRef}
      type='button'
      className={triggerRoot({ class: className })}
      data-placeholder={!hasSelection}
      data-state='closed'
      disabled={disabled}
      onClick={onClick}
      {...rest}
    >
      <MultiSelectValue />
      <RiArrowDownSLine className={triggerArrow()} />
    </button>
  );
});

MultiSelectTrigger.displayName = 'MultiSelectTrigger';

const MultiSelectValue = () => {
  const { selectedValues, options, placeholder, size } =
    useMultiSelectContext();

  const selectedOptions = options.filter((option) =>
    selectedValues.includes(option.value),
  );
  const hasSelection = selectedOptions.length > 0;

  const { tagsContainer, placeholder: placeholderClass } = multiSelectVariants({
    size,
  });

  if (!hasSelection) {
    return <span className={placeholderClass()}>{placeholder}</span>;
  }

  return (
    <div className={tagsContainer()}>
      {selectedOptions.map((option) => (
        <MultiSelectTag key={String(option.value)} option={option} />
      ))}
    </div>
  );
};

MultiSelectValue.displayName = 'MultiSelectValue';

interface MultiSelectTagProps<T = string> {
  option: MultiSelectOption<T>;
}

const MultiSelectTag = <T = string,>({ option }: MultiSelectTagProps<T>) => {
  const { selectedValues, onSelectionChange, disabled, size } =
    useMultiSelectContext<T>();

  const { tag, tagRemove } = multiSelectVariants({ size });

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!disabled) {
      const newValues = selectedValues.filter(
        (value) => value !== option.value,
      );
      onSelectionChange(newValues);
    }
  };

  return (
    <span className={tag()}>
      <span className='max-w-[120px] truncate'>{option.label}</span>
      {!disabled && (
        <RiCloseLine className={tagRemove()} onClick={handleRemove} />
      )}
    </span>
  );
};

MultiSelectTag.displayName = 'MultiSelectTag';

function MultiSelectTriggerIcon<T extends React.ElementType = 'div'>({
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T>) {
  const Component = as || 'div';
  const { size, variant, hasError } = useMultiSelectContext();
  const { triggerIcon } = multiSelectVariants({ size, variant, hasError });

  return <Component className={triggerIcon({ class: className })} {...rest} />;
}

MultiSelectTriggerIcon.displayName = 'MultiSelectTriggerIcon';

interface MultiSelectContentProps {
  onClose: () => void;
}

const MultiSelectContent = ({ onClose }: MultiSelectContentProps) => {
  const contentRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        contentRef.current &&
        !contentRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={contentRef}
      className={cn(
        // base
        'bg-bg-white-0 shadow-regular-md ring-stroke-soft-200 absolute z-50 mt-2 overflow-hidden rounded-2xl ring-1 ring-inset',
        // widths
        'w-full min-w-[320px]',
        // heights
        'max-h-[300px]',
        // animation
        'animate-in fade-in-0 zoom-in-95 slide-in-from-top-2',
      )}
    >
      <div className='p-2'>
        <MultiSelectSearch />
      </div>
      <ScrollAreaPrimitives.Root type='auto'>
        <ScrollAreaPrimitives.Viewport
          style={{ overflowY: undefined }}
          className='max-h-[200px] w-full scroll-py-2 overflow-auto p-2 pt-0'
        >
          <MultiSelectList />
        </ScrollAreaPrimitives.Viewport>
        <ScrollAreaPrimitives.Scrollbar orientation='vertical'>
          <ScrollAreaPrimitives.Thumb className='bg-bg-soft-200 w-1! rounded' />
        </ScrollAreaPrimitives.Scrollbar>
      </ScrollAreaPrimitives.Root>
    </div>
  );
};

MultiSelectContent.displayName = 'MultiSelectContent';

const MultiSelectSearch = () => {
  const { searchValue, onSearchChange, searchPlaceholder, size } =
    useMultiSelectContext();
  const { searchInput } = multiSelectVariants({ size });

  return (
    <div className='border-stroke-soft-200 relative flex items-center gap-2 border-b px-2 py-1.5'>
      <RiSearchLine className='text-text-sub-600 size-4 shrink-0' />
      <input
        type='text'
        className={searchInput()}
        placeholder={searchPlaceholder}
        value={searchValue}
        onChange={(e) => onSearchChange(e.target.value)}
        autoFocus
      />
    </div>
  );
};

MultiSelectSearch.displayName = 'MultiSelectSearch';

const MultiSelectList = () => {
  const { options, searchValue, selectedValues, onSelectionChange } =
    useMultiSelectContext();

  const filteredOptions = React.useMemo(() => {
    if (!searchValue) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(searchValue.toLowerCase()),
    );
  }, [options, searchValue]);

  const handleToggleOption = (optionValue: string) => {
    const isSelected = selectedValues.includes(optionValue);
    const newValues = isSelected
      ? selectedValues.filter((value) => value !== optionValue)
      : [...selectedValues, optionValue];

    onSelectionChange(newValues);
  };

  if (filteredOptions.length === 0) {
    return (
      <div className='text-text-sub-600 py-6 text-center text-sm'>
        No options found
      </div>
    );
  }

  return (
    <div className='space-y-1'>
      {filteredOptions.map((option) => (
        <MultiSelectItem
          key={String(option.value)}
          option={option}
          isSelected={selectedValues.includes(option.value)}
          onToggle={() => handleToggleOption(option.value)}
        />
      ))}
    </div>
  );
};

MultiSelectList.displayName = 'MultiSelectList';

interface MultiSelectItemProps<T = string> {
  option: MultiSelectOption<T>;
  isSelected: boolean;
  onToggle: () => void;
}

const MultiSelectItem = <T = string,>({
  option,
  isSelected,
  onToggle,
}: MultiSelectItemProps<T>) => {
  const { size } = useMultiSelectContext<T>();

  return (
    <div
      className={cn(
        // base
        'group text-paragraph-sm text-text-strong-950 relative cursor-pointer rounded-lg p-2 pr-9 select-none',
        'flex items-center gap-2 transition duration-200 ease-out',
        // disabled
        'data-disabled:text-text-disabled-300 data-disabled:pointer-events-none',
        // hover, focus
        'hover:bg-bg-weak-50',
        {
          'gap-1.5 pr-[34px]': size === 'xsmall',
        },
        option.disabled && 'text-text-disabled-300 pointer-events-none',
      )}
      onClick={!option.disabled ? onToggle : undefined}
      data-disabled={option.disabled}
    >
      <span
        className={cn(
          // base
          'flex flex-1 items-center gap-2',
          // disabled
          'group-data-disabled:text-text-disabled-300',
          {
            'gap-1.5': size === 'xsmall',
          },
        )}
      >
        <span className='line-clamp-1'>{option.label}</span>
      </span>
      {isSelected && (
        <RiCheckLine className='text-text-sub-600 absolute top-1/2 right-2 size-5 shrink-0 -translate-y-1/2' />
      )}
    </div>
  );
};

MultiSelectItem.displayName = 'MultiSelectItem';

function MultiSelectItemIcon<T extends React.ElementType>({
  as,
  className,
  ...rest
}: PolymorphicComponentProps<T>) {
  const { size, variant } = useMultiSelectContext();
  const { itemIcon } = multiSelectVariants({ size, variant });

  const Component = as || 'div';

  return <Component className={itemIcon({ class: className })} {...rest} />;
}

MultiSelectItemIcon.displayName = 'MultiSelectItemIcon';

export {
  MultiSelectRootForwarded as Root,
  MultiSelectTrigger as Trigger,
  MultiSelectTriggerIcon as TriggerIcon,
  MultiSelectValue as Value,
  MultiSelectContent as Content,
  MultiSelectSearch as Search,
  MultiSelectList as List,
  MultiSelectItem as Item,
  MultiSelectItemIcon as ItemIcon,
  MultiSelectTag as Tag,
  type MultiSelectOption as OptionType,
};
