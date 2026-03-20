import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Tailwind sınıflarını koşullu ve çakışmasız birleştirmek için
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
