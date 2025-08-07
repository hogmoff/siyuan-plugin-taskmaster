/**
 * Utility-Funktionen für Datum und Zeit
 */

/**
 * Parst ein Siyuan-formatiertes Datum in ein Date-Objekt
 * @param siyuanDate - Siyuan-Datum im Format YYYYMMDDHHMMSS
 * @returns Date-Objekt oder null bei ungültigem Format
 */
export function parseSiyuanDate(siyuanDate: string): Date | null {
    if (!siyuanDate || siyuanDate.length < 14) return null;
    
    const year = parseInt(siyuanDate.substring(0, 4));
    const month = parseInt(siyuanDate.substring(4, 6)) - 1;
    const day = parseInt(siyuanDate.substring(6, 8));
    const hour = parseInt(siyuanDate.substring(8, 10));
    const minute = parseInt(siyuanDate.substring(10, 12));
    const second = parseInt(siyuanDate.substring(12, 14));
    
    const date = new Date(year, month, day, hour, minute, second);
    return isNaN(date.getTime()) ? null : date;
}

/**
 * Erstellt eine relative Datumsanzeige (z.B. "heute", "morgen")
 * @param date - Das zu formatierende Datum
 * @returns Objekt mit Text und Überfälligkeits-Status
 */
export function getRelativeDateString(date: Date): { text: string; isOverdue: boolean } {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: "heute", isOverdue: false };
    if (diffDays === 1) return { text: "morgen", isOverdue: false };
    if (diffDays === 2) return { text: "übermorgen", isOverdue: false };
    if (diffDays === -1) return { text: "gestern", isOverdue: true };
    if (diffDays > 2) return { text: `in ${diffDays} Tagen`, isOverdue: false };
    return { text: `vor ${Math.abs(diffDays)} Tagen`, isOverdue: true };
}

/**
 * Formatiert ein Datum für die Gruppenanzeige
 * @param date - Das zu formatierende Datum
 * @returns Formatierter String (z.B. "Heute", "Montag, 1. Jan")
 */
export function formatDateGroup(date: Date): string {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays < 0) return "Überfällig";
    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Morgen";
    if (diffDays === 2) return "Übermorgen";
    if (diffDays === -1) return "Gestern";
    
    const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
    const months = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
    
    if (Math.abs(diffDays) <= 7) {
        return `${weekdays[targetDate.getDay()]}, ${targetDate.getDate()}. ${months[targetDate.getMonth()]}`;
    }
    
    return `${targetDate.getDate()}. ${months[targetDate.getMonth()]} ${targetDate.getFullYear()}`;
}

/**
 * Prüft ob ein Datum innerhalb der nächsten n Tage liegt
 * @param date - Das zu prüfende Datum
 * @param days - Anzahl der Tage
 * @returns true wenn das Datum innerhalb der nächsten n Tage liegt
 */
export function isWithinDays(date: Date, days: number): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    const diffTime = targetDate.getTime() - today.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays >= 0 && diffDays <= days;
}

/**
 * Prüft ob ein Datum heute ist
 * @param date - Das zu prüfende Datum
 * @returns true wenn das Datum heute ist
 */
export function isToday(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate.getTime() === today.getTime();
}

// Prüft ob ein Datum in der Vergangenheit liegt
export function isOverdue(date: Date): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);
    
    return targetDate.getTime() < today.getTime();
}