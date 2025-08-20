export interface ColumnStatistics {
  count: number;
  nullCount: number;
  uniqueCount: number;
  sum?: number;
  avg?: number;
  min?: number;
  max?: number;
  median?: number;
  stdDev?: number;
  avgLength?: number;
  minLength?: number;
  maxLength?: number;
  earliestDate?: Date;
  latestDate?: Date;
  dateRange?: string;
}

export class ColumnStatsCalculator {
  static calculateStats(columnData: any[], columnType: string): ColumnStatistics {
    const validData = columnData.filter(v => v !== null && v !== undefined);
    const stats: ColumnStatistics = {
      count: columnData.length,
      nullCount: columnData.length - validData.length,
      uniqueCount: new Set(validData).size
    };
    
    if (this.isNumericType(columnType)) {
      const numbers = validData.map(v => parseFloat(v)).filter(n => !isNaN(n));
      if (numbers.length > 0) {
        stats.sum = numbers.reduce((a, b) => a + b, 0);
        stats.avg = stats.sum / numbers.length;
        stats.min = Math.min(...numbers);
        stats.max = Math.max(...numbers);
        stats.median = this.calculateMedian(numbers);
        stats.stdDev = this.calculateStandardDeviation(numbers);
      }
    } else if (this.isStringType(columnType)) {
      const strings = validData.map(v => String(v));
      if (strings.length > 0) {
        stats.avgLength = strings.reduce((sum, str) => sum + str.length, 0) / strings.length;
        stats.minLength = Math.min(...strings.map(s => s.length));
        stats.maxLength = Math.max(...strings.map(s => s.length));
      }
    } else if (this.isDateType(columnType)) {
      const dates = validData.map(v => new Date(v)).filter(d => !isNaN(d.getTime()));
      if (dates.length > 0) {
        stats.earliestDate = new Date(Math.min(...dates.map(d => d.getTime())));
        stats.latestDate = new Date(Math.max(...dates.map(d => d.getTime())));
        stats.dateRange = `${stats.earliestDate.toLocaleDateString()} - ${stats.latestDate.toLocaleDateString()}`;
      }
    }
    
    return stats;
  }

  private static isNumericType(dataType: string): boolean {
    const numericTypes = ['int', 'integer', 'bigint', 'smallint', 'decimal', 'numeric', 'real', 'double', 'float', 'money'];
    return numericTypes.some(type => dataType.toLowerCase().includes(type));
  }

  private static isStringType(dataType: string): boolean {
    const stringTypes = ['varchar', 'char', 'text', 'string', 'uuid'];
    return stringTypes.some(type => dataType.toLowerCase().includes(type));
  }

  private static isDateType(dataType: string): boolean {
    const dateTypes = ['timestamp', 'date', 'time'];
    return dateTypes.some(type => dataType.toLowerCase().includes(type));
  }

  private static calculateMedian(numbers: number[]): number {
    const sorted = [...numbers].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    
    if (sorted.length % 2 === 0) {
      return (sorted[mid - 1] + sorted[mid]) / 2;
    } else {
      return sorted[mid];
    }
  }

  private static calculateStandardDeviation(numbers: number[]): number {
    const avg = numbers.reduce((a, b) => a + b, 0) / numbers.length;
    const squaredDiffs = numbers.map(n => Math.pow(n - avg, 2));
    const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / numbers.length;
    return Math.sqrt(avgSquaredDiff);
  }
}