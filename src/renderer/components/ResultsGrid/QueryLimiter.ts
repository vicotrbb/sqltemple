export interface QueryLimitConfig {
  defaultLimit: number;
  maxLimit: number;
  warnThreshold: number;
}

export class QueryLimiter {
  private static readonly DEFAULT_CONFIG: QueryLimitConfig = {
    defaultLimit: 1000,
    maxLimit: 10000,
    warnThreshold: 5000
  };
  
  static processQuery(query: string, config = this.DEFAULT_CONFIG): { 
    query: string; 
    warning?: string;
    limitAdded: boolean;
  } {
    const trimmedQuery = query.trim();
    const hasLimit = /\bLIMIT\s+\d+/i.test(trimmedQuery);
    
    if (!hasLimit) {
      return {
        query: `${trimmedQuery} LIMIT ${config.defaultLimit}`,
        limitAdded: true
      };
    }
    
    const limitMatch = trimmedQuery.match(/\bLIMIT\s+(\d+)/i);
    if (limitMatch) {
      const limit = parseInt(limitMatch[1]);
      if (limit > config.warnThreshold) {
        return {
          query: trimmedQuery,
          warning: `Query limit (${limit.toLocaleString()}) exceeds recommended threshold (${config.warnThreshold.toLocaleString()}). This may impact performance.`,
          limitAdded: false
        };
      }
    }
    
    return {
      query: trimmedQuery,
      limitAdded: false
    };
  }
  
  static getConfig(): QueryLimitConfig {
    const saved = localStorage.getItem('sqltemple-query-limits');
    if (saved) {
      try {
        return { ...this.DEFAULT_CONFIG, ...JSON.parse(saved) };
      } catch {
        return this.DEFAULT_CONFIG;
      }
    }
    return this.DEFAULT_CONFIG;
  }
  
  static setConfig(config: Partial<QueryLimitConfig>): void {
    const currentConfig = this.getConfig();
    const newConfig = { ...currentConfig, ...config };
    localStorage.setItem('sqltemple-query-limits', JSON.stringify(newConfig));
  }
}