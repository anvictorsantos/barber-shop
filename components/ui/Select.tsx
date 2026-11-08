'use client'

import { Check, ChevronsUpDown } from 'lucide-react'
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react'

import { cn } from '@/lib/utils'

export interface SelectOption {
  label: string
  value: string
}

export function Select({
  id,
  value,
  onValueChange,
  options,
  placeholder = 'Selecione…',
  disabled = false,
  className,
  triggerClassName,
  'aria-label': ariaLabel,
}: {
  id?: string
  value: string
  onValueChange: (value: string) => void
  options: SelectOption[]
  placeholder?: string
  disabled?: boolean
  className?: string
  triggerClassName?: string
  'aria-label'?: string
}) {
  const generatedId = useId()
  const selectId = id ?? generatedId
  const listboxId = `${selectId}-listbox`
  const [open, setOpen] = useState(false)
  const [highlighted, setHighlighted] = useState(-1)
  const rootRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const listRef = useRef<HTMLUListElement>(null)

  const selectedIndex = options.findIndex((option) => option.value === value)
  const selectedLabel = options[selectedIndex]?.label ?? null

  useEffect(() => {
    if (!open) return
    const onPointerDown = (event: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(event.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onPointerDown)
    return () => document.removeEventListener('mousedown', onPointerDown)
  }, [open])

  useEffect(() => {
    if (!open) return
    listRef.current?.focus()
    document
      .getElementById(`${selectId}-option-${highlighted}`)
      ?.scrollIntoView({ block: 'nearest' })
  }, [open, highlighted, selectId])

  function openList() {
    if (disabled) return
    setHighlighted(selectedIndex >= 0 ? selectedIndex : 0)
    setOpen(true)
  }

  function closeList(focusTrigger = true) {
    setOpen(false)
    if (focusTrigger) triggerRef.current?.focus()
  }

  function choose(index: number) {
    const option = options[index]
    if (!option) return
    onValueChange(option.value)
    closeList()
  }

  function onTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (
      event.key === 'ArrowDown' ||
      event.key === 'ArrowUp' ||
      event.key === 'Enter' ||
      event.key === ' '
    ) {
      event.preventDefault()
      if (open) closeList()
      else openList()
    } else if (event.key === 'Escape' || event.key === 'Tab') {
      setOpen(false)
    }
  }

  function onListKeyDown(event: KeyboardEvent<HTMLUListElement>) {
    const last = options.length - 1

    if (event.key === 'ArrowDown') {
      event.preventDefault()
      setHighlighted((index) => (index >= last ? 0 : index + 1))
    } else if (event.key === 'ArrowUp') {
      event.preventDefault()
      setHighlighted((index) => (index <= 0 ? last : index - 1))
    } else if (event.key === 'Home') {
      event.preventDefault()
      setHighlighted(0)
    } else if (event.key === 'End') {
      event.preventDefault()
      setHighlighted(last)
    } else if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault()
      choose(highlighted)
    } else if (event.key === 'Escape') {
      event.preventDefault()
      closeList()
    } else if (event.key === 'Tab') {
      setOpen(false)
    }
  }

  return (
    <div
      ref={rootRef}
      className={cn('relative', className)}
    >
      <button
        ref={triggerRef}
        id={selectId}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={open ? listboxId : undefined}
        aria-label={ariaLabel}
        onClick={() => (open ? closeList(false) : openList())}
        onKeyDown={onTriggerKeyDown}
        className={cn(
          'flex h-10 w-full cursor-pointer items-center justify-between gap-2 rounded-lg border border-white/10 bg-surface-input px-3 text-left text-body transition hover:border-white/20 focus:border-accent disabled:cursor-not-allowed disabled:opacity-50',
          triggerClassName,
        )}
      >
        <span className={cn('truncate', selectedLabel ? 'text-text' : 'text-muted')}>
          {selectedLabel ?? placeholder}
        </span>
        <ChevronsUpDown
          aria-hidden
          className="h-4 w-4 shrink-0 text-muted"
        />
      </button>

      {open ? (
        <ul
          ref={listRef}
          id={listboxId}
          role="listbox"
          aria-labelledby={selectId}
          tabIndex={-1}
          onKeyDown={onListKeyDown}
          className="animate-select-pop absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-xl border border-white/10 bg-surface-input py-1 shadow-card focus:outline-none"
        >
          {options.length === 0 ? (
            <li className="px-3 py-2 text-caption text-muted">Nenhuma opção</li>
          ) : (
            options.map((option, index) => {
              const selected = option.value === value
              return (
                <li
                  key={option.value}
                  id={`${selectId}-option-${index}`}
                  role="option"
                  aria-selected={selected}
                  onMouseDown={(event) => event.preventDefault()}
                  onMouseEnter={() => setHighlighted(index)}
                  onClick={() => choose(index)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault()
                      event.stopPropagation()
                      choose(index)
                    }
                  }}
                  className={cn(
                    'flex cursor-pointer items-center justify-between gap-2 px-3 py-2 text-body transition',
                    selected
                      ? 'bg-primary font-semibold text-white'
                      : index === highlighted
                        ? 'bg-white/5 text-text'
                        : 'text-text',
                  )}
                >
                  <span className="truncate">{option.label}</span>
                  {selected ? (
                    <Check
                      aria-hidden
                      className="h-4 w-4 shrink-0"
                    />
                  ) : null}
                </li>
              )
            })
          )}
        </ul>
      ) : null}
    </div>
  )
}
