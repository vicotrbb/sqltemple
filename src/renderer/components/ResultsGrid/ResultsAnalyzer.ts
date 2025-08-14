import { QueryResult } from "../../../main/database/interfaces";

export interface AnalysisRequest {
  query: string;
  results: QueryResult;
  maxRows: number;
}

export interface AnalysisResponse {
  summary: string;
  insights: string[];
  recommendations: string[];
  dataQuality: {
    nullPercentage: number;
    duplicateCount: number;
    uniqueValues: number;
  };
  patterns: string[];
}

export class ResultsAnalyzer {
  static async analyzeResults(request: AnalysisRequest): Promise<AnalysisResponse> {
    const sampleData = request.results.rows.slice(0, Math.min(request.maxRows, 100));
    
    const prompt = `
Analyze the following SQL query results:

Query: ${request.query}
Row count: ${request.results.rowCount}
Columns: ${request.results.columns.map(c => `${c.name} (${c.dataType})`).join(', ')}

Sample data (first ${sampleData.length} rows):
${JSON.stringify(sampleData, null, 2)}

Provide a comprehensive analysis in the following JSON format:
{
  "summary": "Brief overview of what this data represents",
  "insights": ["Key insight 1", "Key insight 2", "Key insight 3"],
  "recommendations": ["Recommendation 1", "Recommendation 2"],
  "dataQuality": {
    "nullPercentage": 0,
    "duplicateCount": 0,
    "uniqueValues": 0
  },
  "patterns": ["Pattern 1", "Pattern 2"]
}

Focus on:
1. Data distribution and patterns
2. Data quality issues (nulls, duplicates)
3. Potential insights for business decisions
4. Recommendations for further analysis
5. Any anomalies or interesting patterns

Return ONLY valid JSON without any markdown formatting.`;

    try {
      const response = await window.api.aiAnalyzeData(prompt);
      
      if (!response.success) {
        throw new Error(response.error || 'AI analysis failed');
      }

      const parsed = this.parseAnalysisResponse(response.result);
      return this.enhanceWithCalculatedStats(parsed, request.results);
    } catch (error) {
      console.error('AI Analysis Error:', error);
      return this.createFallbackAnalysis(request.results);
    }
  }

  private static parseAnalysisResponse(response: string): AnalysisResponse {
    try {
      // Clean up the response more thoroughly
      let cleaned = response.trim();
      
      // Remove markdown code blocks
      cleaned = cleaned.replace(/```json\s*|\s*```|```\s*/g, '');
      
      // Remove any leading/trailing text that might not be JSON
      const jsonStart = cleaned.indexOf('{');
      const jsonEnd = cleaned.lastIndexOf('}');
      
      if (jsonStart !== -1 && jsonEnd !== -1 && jsonEnd > jsonStart) {
        cleaned = cleaned.substring(jsonStart, jsonEnd + 1);
      }
      
      const parsed = JSON.parse(cleaned);
      
      return {
        summary: parsed.summary || 'AI analysis completed',
        insights: Array.isArray(parsed.insights) ? parsed.insights : [],
        recommendations: Array.isArray(parsed.recommendations) ? parsed.recommendations : [],
        dataQuality: {
          nullPercentage: parsed.dataQuality?.nullPercentage || 0,
          duplicateCount: parsed.dataQuality?.duplicateCount || 0,
          uniqueValues: parsed.dataQuality?.uniqueValues || 0
        },
        patterns: Array.isArray(parsed.patterns) ? parsed.patterns : []
      };
    } catch (error) {
      console.error('JSON parsing error:', error, 'Response:', response);
      throw error;
    }
  }

  private static createFallbackAnalysis(results: QueryResult): AnalysisResponse {
    const totalCells = results.rowCount * results.columns.length;
    let nullCount = 0;
    
    // Calculate basic stats
    for (const row of results.rows) {
      for (const column of results.columns) {
        if (row[column.name] === null || row[column.name] === undefined) {
          nullCount++;
        }
      }
    }
    
    const allValues = results.rows.flatMap(row => 
      results.columns.map(col => JSON.stringify(row[col.name]))
    );
    const uniqueValues = new Set(allValues).size;
    const duplicateCount = allValues.length - uniqueValues;
    
    return {
      summary: `Dataset contains ${results.rowCount.toLocaleString()} rows and ${results.columns.length} columns. Basic analysis completed due to AI service unavailability.`,
      insights: [
        `Dataset has ${results.columns.length} columns: ${results.columns.map(c => c.name).join(', ')}`,
        `Total of ${results.rowCount.toLocaleString()} records analyzed`,
        nullCount > 0 ? `Contains ${nullCount} NULL values` : 'No NULL values detected'
      ],
      recommendations: [
        'Check data quality and completeness',
        'Consider data validation and cleaning if needed',
        'Try AI analysis again when service is available'
      ],
      dataQuality: {
        nullPercentage: totalCells > 0 ? (nullCount / totalCells) * 100 : 0,
        duplicateCount,
        uniqueValues
      },
      patterns: [
        'Basic statistical analysis available in column tooltips',
        'Hover over column headers for detailed statistics'
      ]
    };
  }

  private static enhanceWithCalculatedStats(analysis: AnalysisResponse, results: QueryResult): AnalysisResponse {
    const totalCells = results.rowCount * results.columns.length;
    let nullCount = 0;
    
    for (const row of results.rows) {
      for (const column of results.columns) {
        if (row[column.name] === null || row[column.name] === undefined) {
          nullCount++;
        }
      }
    }
    
    const allValues = results.rows.flatMap(row => 
      results.columns.map(col => JSON.stringify(row[col.name]))
    );
    const uniqueValues = new Set(allValues).size;
    const duplicateCount = allValues.length - uniqueValues;
    
    return {
      ...analysis,
      dataQuality: {
        nullPercentage: totalCells > 0 ? (nullCount / totalCells) * 100 : 0,
        duplicateCount,
        uniqueValues
      }
    };
  }
}