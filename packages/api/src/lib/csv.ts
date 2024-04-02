export function listToCsvLine(values: any, stream: any): void {
    const cols = values.map(formatForCsv);
    const csvLine = `${cols.join(',')}\n`;
    stream.write(csvLine, 'utf8');
}

function formatForCsv(value: string): string {
    const str = String(value);
    if (/[,"\\n]/.test(str)) {
        return `"${str.replace(/"/g, '""')}"`
    }
    return value;
}
