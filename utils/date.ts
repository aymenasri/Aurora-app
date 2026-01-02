
export const formatDate = (date: Date, language: string = 'fr') => {
    try {
        // Enforce Latin numerals for Arabic
        const options: Intl.DateTimeFormatOptions = {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
        };

        // Use 'ar-EG' or similar specific locale with latin numbering if possible,
        // or just rely on 'u-nu-latn' extension. 
        // Some Android versions might ignore 'u-nu-latn' in the string but accept it in resolvedOptions?
        // safest is trying explicit numberingSystem option if available.

        if (language === 'ar') {
            // Try Standard Intl first
            if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
                return new Intl.DateTimeFormat('ar', {
                    ...options,
                    numberingSystem: 'latn'
                }).format(date);
            }
            // Fallback
            return date.toLocaleDateString('ar-u-nu-latn', options);
        }

        return date.toLocaleDateString(language, options);
    } catch (e) {
        return date.toLocaleDateString(language);
    }
};

export const formatTime = (date: Date, language: string = 'fr') => {
    try {
        const options: Intl.DateTimeFormatOptions = {
            hour: '2-digit',
            minute: '2-digit',
            hour12: false // Force 24h format usually preferred, or adapt
        };

        if (language === 'ar') {
            if (typeof Intl !== 'undefined' && Intl.DateTimeFormat) {
                return new Intl.DateTimeFormat('ar', {
                    ...options,
                    numberingSystem: 'latn'
                }).format(date);
            }
            return date.toLocaleTimeString('ar-u-nu-latn', options);
        }
        return date.toLocaleTimeString(language, options);
    } catch (e) {
        return date.toLocaleTimeString(language);
    }
};
