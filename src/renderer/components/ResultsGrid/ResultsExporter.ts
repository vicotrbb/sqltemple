import { QueryResult } from "../../../main/database/interfaces";

export interface ExportOptions {
  format: 'csv' | 'tsv' | 'json' | 'xml';
  includeHeaders: boolean;
  dateFormat: 'iso' | 'local' | 'unix';
  nullValue: string;
  delimiter?: string;
}

export interface ExportResult {
  data: string;
  filename: string;
  mimeType: string;
}

export class ResultsExporter {
  static async exportToCSV(results: QueryResult, options: ExportOptions): Promise<string> {
    const delimiter = options.delimiter || ',';
    const headers = results.columns.map(col => col.name);
    
    let csv = '';
    if (options.includeHeaders) {
      csv += headers.join(delimiter) + '\n';
    }
    
    for (const row of results.rows) {
      const values = headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) {
          return options.nullValue;
        }
        if (typeof value === 'string') {
          return `"${value.replace(/"/g, '""')}"`;
        }
        if (value instanceof Date) {
          return this.formatDate(value, options.dateFormat);
        }
        return String(value);
      });
      csv += values.join(delimiter) + '\n';
    }
    
    return csv;
  }
  
  static async exportToTSV(results: QueryResult, options: ExportOptions): Promise<string> {
    return this.exportToCSV(results, { ...options, delimiter: '\t' });
  }
  
  static async exportToJSON(results: QueryResult, options: ExportOptions): Promise<string> {
    const processedRows = results.rows.map(row => {
      const processedRow: any = {};
      for (const [key, value] of Object.entries(row)) {
        if (value === null || value === undefined) {
          processedRow[key] = null;
        } else if (value instanceof Date) {
          processedRow[key] = this.formatDate(value, options.dateFormat);
        } else {
          processedRow[key] = value;
        }
      }
      return processedRow;
    });
    
    return JSON.stringify(processedRows, null, 2);
  }
  
  static async exportToXML(results: QueryResult, options: ExportOptions): Promise<string> {
    let xml = '<?xml version="1.0" encoding="UTF-8"?>\n<results>\n';
    
    for (const row of results.rows) {
      xml += '  <row>\n';
      for (const [key, value] of Object.entries(row)) {
        const cleanKey = key.replace(/[^a-zA-Z0-9_]/g, '_');
        let processedValue = '';
        
        if (value === null || value === undefined) {
          processedValue = options.nullValue;
        } else if (value instanceof Date) {
          processedValue = this.formatDate(value, options.dateFormat);
        } else {
          processedValue = String(value).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
        }
        
        xml += `    <${cleanKey}>${processedValue}</${cleanKey}>\n`;
      }
      xml += '  </row>\n';
    }
    
    xml += '</results>';
    return xml;
  }
  
  static async exportResults(results: QueryResult, options: ExportOptions): Promise<ExportResult> {
    let data: string;
    let filename: string;
    let mimeType: string;
    
    switch (options.format) {
      case 'csv':
        data = await this.exportToCSV(results, options);
        filename = `query_results_${Date.now()}.csv`;
        mimeType = 'text/csv';
        break;
      case 'tsv':
        data = await this.exportToTSV(results, options);
        filename = `query_results_${Date.now()}.tsv`;
        mimeType = 'text/tab-separated-values';
        break;
      case 'json':
        data = await this.exportToJSON(results, options);
        filename = `query_results_${Date.now()}.json`;
        mimeType = 'application/json';
        break;
      case 'xml':
        data = await this.exportToXML(results, options);
        filename = `query_results_${Date.now()}.xml`;
        mimeType = 'application/xml';
        break;
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
    
    return { data, filename, mimeType };
  }
  
  private static formatDate(date: Date, format: 'iso' | 'local' | 'unix'): string {
    switch (format) {
      case 'iso':
        return date.toISOString();
      case 'local':
        return date.toLocaleString();
      case 'unix':
        return Math.floor(date.getTime() / 1000).toString();
      default:
        return date.toISOString();
    }
  }
}