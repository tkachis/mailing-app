'use client';

import { RiInformationFill } from '@remixicon/react';
import { useTranslations } from 'next-globe-gen';
import { FC, useRef, useState, useCallback, KeyboardEvent } from 'react';

import { Hint, Label, Textarea } from 'src/components';
import templateService from 'src/services/template.service';

type TemplateInputProps = {
  name: string;
  label: string;
  error?: string | null;
  required?: boolean;
  defaultValue?: string;
  disabled?: boolean;
};

const TemplateInput: FC<TemplateInputProps> = ({
  name,
  label,
  error,
  required,
  defaultValue,
  disabled = false,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const t = useTranslations('pages.editCreateFlow.form.email_template');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState(
    templateService.getAvailableVariables(),
  );
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(0);

  const insertVariable = useCallback((variableKey: string) => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    const cursorPos = textarea.selectionStart;
    const value = textarea.value;

    // Find the start of the current variable (if user has already started typing)
    const beforeCursor = value.substring(0, cursorPos);
    const match = templateService.findVariableStart(beforeCursor);

    let startPos = cursorPos;
    const endPos = cursorPos;

    if (match) {
      // If user has already started typing a variable, replace it
      startPos = cursorPos - match[0].length;
    }

    const variable = `@${variableKey}`;
    const newValue =
      value.substring(0, startPos) + variable + value.substring(endPos);

    textarea.value = newValue;

    // Set cursor after inserted variable
    const newCursorPosition = startPos + variable.length;
    textarea.setSelectionRange(newCursorPosition, newCursorPosition);
    textarea.focus();

    setShowSuggestions(false);
  }, []);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent<HTMLTextAreaElement>) => {
      if (!showSuggestions) return;

      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev < suggestions.length - 1 ? prev + 1 : 0,
          );
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedSuggestionIndex((prev) =>
            prev > 0 ? prev - 1 : suggestions.length - 1,
          );
          break;
        case 'Enter':
        case 'Tab':
          e.preventDefault();
          insertVariable(suggestions[selectedSuggestionIndex].key);
          break;
        case 'Escape':
          e.preventDefault();
          setShowSuggestions(false);
          break;
        case 'Backspace':
          // Check if we need to delete the entire variable
          const textarea = e.currentTarget;
          const cursorPos = textarea.selectionStart;
          const value = textarea.value;

          // Find variable before cursor
          const beforeCursor = value.substring(0, cursorPos);
          const match = templateService.findIncompleteVariable(beforeCursor);

          if (match) {
            e.preventDefault();
            const startPos = cursorPos - match[0].length;
            const newValue =
              value.substring(0, startPos) + value.substring(cursorPos);
            textarea.value = newValue;
            textarea.setSelectionRange(startPos, startPos);
            setShowSuggestions(false);
          }
          break;
      }
    },
    [showSuggestions, suggestions, selectedSuggestionIndex, insertVariable],
  );

  const handleInput = useCallback((e: React.FormEvent<HTMLTextAreaElement>) => {
    const textarea = e.currentTarget;
    const cursorPos = textarea.selectionStart;
    const value = textarea.value;

    // Check if user is starting to type a variable
    const beforeCursor = value.substring(0, cursorPos);
    const match = templateService.findVariableStart(beforeCursor);

    if (match) {
      const searchTerm = match[1];
      const filteredSuggestions = templateService
        .getAvailableVariables()
        .filter((variable) =>
          variable.key.toLowerCase().includes(searchTerm.toLowerCase()),
        );

      setSuggestions(filteredSuggestions);
      setSelectedSuggestionIndex(0);
      setShowSuggestions(filteredSuggestions.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, []);

  return (
    <div className='relative flex w-full flex-col gap-2'>
      <Label.Root htmlFor={name}>
        {label}
        {required && <Label.Asterisk />}
      </Label.Root>

      <Textarea.Root
        ref={textareaRef}
        id={name}
        name={name}
        required={required}
        defaultValue={defaultValue}
        onKeyDown={handleKeyDown}
        onInput={handleInput}
        hasError={!!error}
        className='min-h-[120px]'
        disabled={disabled}
      />

      {showSuggestions && suggestions.length > 0 && (
        <div className='border-border-200 absolute top-full right-0 left-0 z-10 mt-1 max-h-48 overflow-y-auto rounded-md border bg-white shadow-lg'>
          <div className='border-b border-gray-100 px-3 py-2'>
            <div className='text-xs font-medium text-gray-700'>
              {t('available_variables')}
            </div>
            <div className='text-xs text-gray-500'>
              {t('press_tab_or_enter_to_insert')}
            </div>
          </div>
          {suggestions.map((variable, index) => (
            <button
              key={variable.key}
              type='button'
              className={`w-full px-3 py-2 text-left text-sm transition-colors hover:bg-gray-50 ${
                index === selectedSuggestionIndex
                  ? 'border-l-2 border-blue-500 bg-blue-50 text-blue-700'
                  : 'text-gray-700'
              }`}
              onClick={() => insertVariable(variable.key)}
            >
              <div className='flex items-center justify-between'>
                <div className='font-mono font-medium'>{`@${variable.key}`}</div>
                <div className='text-xs text-gray-400'>{variable.label}</div>
              </div>
              {variable.description && (
                <div className='text-text-soft-400 mt-1 text-xs'>
                  {variable.description}
                </div>
              )}
            </button>
          ))}
        </div>
      )}

      <Hint.Root hasError={!!error}>
        {error ? (
          error
        ) : (
          <>
            <Hint.Icon as={RiInformationFill} />
            {t('hint')}
          </>
        )}
      </Hint.Root>
    </div>
  );
};

export default TemplateInput;
