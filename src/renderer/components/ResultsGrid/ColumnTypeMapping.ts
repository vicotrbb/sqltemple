export interface ColumnTypeInfo {
  displayName: string;
  icon: string;
  format: (value: any) => string;
  validate: (value: any) => boolean;
}

export const COLUMN_TYPE_MAPPINGS: Record<string, ColumnTypeInfo> = {
  'uuid': {
    displayName: 'UUID',
    icon: '🔑',
    format: (value: string) => value,
    validate: (value: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)
  },
  'varchar': {
    displayName: 'Text',
    icon: '📝',
    format: (value: string) => value,
    validate: (value: string) => typeof value === 'string'
  },
  'text': {
    displayName: 'Text',
    icon: '📝',
    format: (value: string) => value,
    validate: (value: string) => typeof value === 'string'
  },
  'integer': {
    displayName: 'Integer',
    icon: '🔢',
    format: (value: number) => value?.toLocaleString() || '',
    validate: (value: any) => Number.isInteger(Number(value))
  },
  'bigint': {
    displayName: 'Big Integer',
    icon: '🔢',
    format: (value: number) => value?.toLocaleString() || '',
    validate: (value: any) => Number.isInteger(Number(value))
  },
  'numeric': {
    displayName: 'Numeric',
    icon: '🔢',
    format: (value: number) => value?.toLocaleString() || '',
    validate: (value: any) => !isNaN(Number(value))
  },
  'decimal': {
    displayName: 'Decimal',
    icon: '🔢',
    format: (value: number) => value?.toLocaleString() || '',
    validate: (value: any) => !isNaN(Number(value))
  },
  'timestamp': {
    displayName: 'Timestamp',
    icon: '📅',
    format: (value: string | Date) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? String(value) : date.toLocaleString();
    },
    validate: (value: any) => !isNaN(new Date(value).getTime())
  },
  'date': {
    displayName: 'Date',
    icon: '📅',
    format: (value: string | Date) => {
      const date = new Date(value);
      return isNaN(date.getTime()) ? String(value) : date.toLocaleDateString();
    },
    validate: (value: any) => !isNaN(new Date(value).getTime())
  },
  'time': {
    displayName: 'Time',
    icon: '🕐',
    format: (value: string) => value,
    validate: (value: string) => /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]/.test(value)
  },
  'boolean': {
    displayName: 'Boolean',
    icon: '✓',
    format: (value: boolean) => value ? 'true' : 'false',
    validate: (value: any) => typeof value === 'boolean' || value === 'true' || value === 'false'
  },
  'json': {
    displayName: 'JSON',
    icon: '{}',
    format: (value: any) => {
      try {
        return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    },
    validate: (value: any) => {
      try {
        JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  },
  'jsonb': {
    displayName: 'JSONB',
    icon: '{}',
    format: (value: any) => {
      try {
        return typeof value === 'string' ? value : JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    },
    validate: (value: any) => {
      try {
        JSON.parse(typeof value === 'string' ? value : JSON.stringify(value));
        return true;
      } catch {
        return false;
      }
    }
  }
};

export const getColumnTypeInfo = (dataType: string): ColumnTypeInfo => {
  const normalizedType = dataType.toLowerCase().replace(/\([^)]*\)/, '');
  
  for (const [key, info] of Object.entries(COLUMN_TYPE_MAPPINGS)) {
    if (normalizedType.includes(key)) {
      return info;
    }
  }
  
  return {
    displayName: dataType,
    icon: '❓',
    format: (value: any) => String(value),
    validate: () => true
  };
};