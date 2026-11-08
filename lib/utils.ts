import { clsx, type ClassValue } from 'clsx'
import { extendTailwindMerge } from 'tailwind-merge'

// tailwind-merge cannot tell the custom size tokens (text-body) from custom colors
// (text-text) without this, and silently drops one of them.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      'font-size': [
        {
          text: ['micro', 'caption', 'label', 'body', 'lead', 'title', 'page', 'metric', 'brand'],
        },
      ],
    },
  },
})

export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs))
}
