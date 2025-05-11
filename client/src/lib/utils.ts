import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency: string = '₦'): string {
  return `${currency}${amount.toLocaleString()}`;
}

export function calculateCommission(stake: number): number {
  // 10% for stakes less than 50,000, 5% for 50,000 and above
  return stake >= 50000 ? 0.05 : 0.1;
}

export function calculateWinnings(totalPool: number, commissionRate: number): number {
  return totalPool * (1 - commissionRate);
}

export function getInitials(username: string): string {
  return username
    .split(' ')
    .map(name => name.charAt(0).toUpperCase())
    .join('')
    .slice(0, 2);
}

export function getRandomStoneNumber(): number {
  const stones = [1, 3, 4, 5, 7, 8, 11, 12, 13, 14, 16, 19, 20, 21, 22, 26, 27, 28, 29, 30, 32, 37, 40, 43, 44, 64, 65, 71, 81, 82, 91, 99, 100, 101, 105];
  return stones[Math.floor(Math.random() * stones.length)];
}

export function getWebSocketUrl(): string {
  const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${protocol}//${window.location.host}/ws`;
}

export function generateAvatar(initials: string, color: string): string {
  return `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" width="100" height="100">
      <circle cx="50" cy="50" r="50" fill="${color}" />
      <text x="50" y="50" dy=".3em" fill="white" font-family="Arial" font-size="40" text-anchor="middle" font-weight="bold">
        ${initials}
      </text>
    </svg>
  `;
}

export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;
  
  return function(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };
    
    if (timeout !== null) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}
