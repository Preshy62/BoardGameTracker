import crypto from 'crypto';

/**
 * Secure random number generator for game stone numbers
 */
export class RandomNumberGenerator {
  private readonly GAME_STONES = [
    1, 3, 4, 5, 7, 8, 11, 12, 13, 14, 16, 19, 20, 21, 22, 26, 27, 28, 29, 30, 
    32, 37, 40, 43, 44, 64, 65, 71, 81, 82, 91, 99, 100, 101, 105, 500, 1000
  ];

  /**
   * Generate a random number from the game stone numbers
   * using cryptographically secure random number generation
   */
  generateGameStoneNumber(): number {
    // Generate a secure random index
    const randomIndex = this.getSecureRandomInt(0, this.GAME_STONES.length - 1);
    return this.GAME_STONES[randomIndex];
  }

  /**
   * Generate a random integer between min and max (inclusive)
   * using cryptographically secure random number generation
   */
  private getSecureRandomInt(min: number, max: number): number {
    // Ensure min and max are integers
    min = Math.ceil(min);
    max = Math.floor(max);
    
    // Get random bytes from crypto module
    const range = max - min + 1;
    const bytesNeeded = Math.ceil(Math.log2(range) / 8);
    const maxValid = Math.floor((2 ** (bytesNeeded * 8)) / range) * range - 1;
    
    let randomValue: number;
    let randomBytes: Buffer;
    
    do {
      randomBytes = crypto.randomBytes(bytesNeeded);
      randomValue = 0;
      
      for (let i = 0; i < bytesNeeded; i++) {
        randomValue = (randomValue << 8) | randomBytes[i];
      }
    } while (randomValue > maxValid);
    
    return min + (randomValue % range);
  }

  /**
   * Generate a random integer between min and max (inclusive)
   */
  generateRandomInt(min: number, max: number): number {
    return this.getSecureRandomInt(min, max);
  }

  /**
   * Generate a secure random alphanumeric string of specified length
   */
  generateRandomString(length: number): string {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    
    for (let i = 0; i < length; i++) {
      result += chars[this.getSecureRandomInt(0, chars.length - 1)];
    }
    
    return result;
  }

  /**
   * Generate a secure transaction reference
   */
  generateTransactionReference(prefix: string = 'BBG'): string {
    const timestamp = Date.now().toString().slice(-6);
    const random = this.generateRandomString(8);
    return `${prefix}-${timestamp}-${random}`;
  }
}
