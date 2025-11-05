/**
 * Fonctions utilitaires - Équipements Sportifs
 * Fonctions communes et helpers pour l'application
 */

class Utils {
    constructor() {
        this.cache = new Map();
        this.debounceTimers = new Map();
        this.throttleTimers = new Map();
    }
    
    /**
     * Debounce - Retarde l'exécution d'une fonction
     */
    debounce(func, wait, immediate = false) {
        return function executedFunction(...args) {
            const later = () => {
                Utils.clearDebounceTimer(executedFunction);
                if (!immediate) func(...args);
            };
            
            const callNow = immediate && !Utils.getDebounceTimer(executedFunction);
            
            Utils.setDebounceTimer(executedFunction, later, wait);
            
            if (callNow) func(...args);
        };
    }
    
    /**
     * Throttle - Limite la fréquence d'exécution d'une fonction
     */
    throttle(func, limit) {
        let inThrottle;
        return function executedFunction(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Gestion des timers de debounce
     */
    static setDebounceTimer(func, timer, wait) {
        const funcId = func.toString().length + Math.random();
        if (!window.debounceTimers) window.debounceTimers = new Map();
        window.debounceTimers.set(funcId, timer);
        setTimeout(() => {
            window.debounceTimers.delete(funcId);
        }, wait);
    }
    
    static clearDebounceTimer(func) {
        if (window.debounceTimers) {
            window.debounceTimers.clear();
        }
    }
    
    static getDebounceTimer(func) {
        return window.debounceTimers && window.debounceTimers.size > 0;
    }
    
    /**
     * Formatage des nombres
     */
    formatNumber(num, decimals = 0) {
        if (typeof num !== 'number') return '0';
        return num.toLocaleString('fr-FR', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }
    
    /**
     * Formatage des pourcentages
     */
    formatPercentage(value, decimals = 1) {
        if (typeof value !== 'number') return '0%';
        return (value * 100).toFixed(decimals) + '%';
    }
    
    /**
     * Formatage des devises
     */
    formatCurrency(amount, currency = 'EUR') {
        if (typeof amount !== 'number') return '0 €';
        return new Intl.NumberFormat('fr-FR', {
            style: 'currency',
            currency: currency
        }).format(amount);
    }
    
    /**
     * Formatage des dates
     */
    formatDate(date, options = {}) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        };
        
        return dateObj.toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
    }
    
    /**
     * Formatage des dates et heures
     */
    formatDateTime(date, options = {}) {
        if (!date) return '';
        
        const dateObj = new Date(date);
        if (isNaN(dateObj.getTime())) return '';
        
        const defaultOptions = {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        };
        
        return dateObj.toLocaleDateString('fr-FR', { ...defaultOptions, ...options });
    }
    
    /**
     * Formatage de durée
     */
    formatDuration(milliseconds) {
        if (typeof milliseconds !== 'number') return '';
        
        const seconds = Math.floor(milliseconds / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) return `${days} jour${days > 1 ? 's' : ''}`;
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }
    
    /**
     * Génération d'un ID unique
     */
    generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    
    /**
     * Génération d'un slug URL
     */
    slugify(text) {
        return text
            .toString()
            .toLowerCase()
            .trim()
            .replace(/\s+/g, '-')
            .replace(/[^\w\-]+/g, '')
            .replace(/\-\-+/g, '-')
            .replace(/^-+/, '')
            .replace(/-+$/, '');
    }
    
    /**
     * Capitalisation
     */
    capitalize(text) {
        if (!text) return '';
        return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
    }
    
    /**
     * Tronquage de texte
     */
    truncate(text, length = 100, suffix = '...') {
        if (!text || text.length <= length) return text;
        return text.substring(0, length).trim() + suffix;
    }
    
    /**
     * Validation d'email
     */
    isValidEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }
    
    /**
     * Validation de téléphone français
     */
    isValidPhone(phone) {
        const phoneRegex = /^(\+33|0)[1-9](\d{2}){4}$/;
        return phoneRegex.test(phone.replace(/\s/g, ''));
    }
    
    /**
     * Validation de code postal français
     */
    isValidPostalCode(code) {
        const postalCodeRegex = /^(0[1-9]|[1-8]\d|9[0-8])\d{3}$/;
        return postalCodeRegex.test(code);
    }
    
    /**
     * Validation de coordonnées GPS
     */
    isValidCoordinates(lat, lng) {
        return (
            typeof lat === 'number' &&
            typeof lng === 'number' &&
            lat >= -90 && lat <= 90 &&
            lng >= -180 && lng <= 180
        );
    }
    
    /**
     * Calcul de distance entre deux points GPS (formule de Haversine)
     */
    calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Rayon de la Terre en km
        const dLat = this.toRadians(lat2 - lat1);
        const dLng = this.toRadians(lng2 - lng1);
        
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRadians(lat1)) * Math.cos(this.toRadians(lat2)) *
                  Math.sin(dLng / 2) * Math.sin(dLng / 2);
        
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }
    
    /**
     * Conversion degrés en radians
     */
    toRadians(degrees) {
        return degrees * (Math.PI / 180);
    }
    
    /**
     * Formatage de distance
     */
    formatDistance(distance, unit = 'km') {
        if (typeof distance !== 'number') return '0 km';
        
        if (distance < 1) {
            return `${Math.round(distance * 1000)} m`;
        }
        
        return `${distance.toFixed(1)} ${unit}`;
    }
    
    /**
     * Gestion du cache
     */
    setCache(key, data, ttl = 5 * 60 * 1000) { // 5 minutes par défaut
        const cacheItem = {
            data,
            timestamp: Date.now(),
            ttl
        };
        this.cache.set(key, cacheItem);
    }
    
    getCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;
        
        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            return null;
        }
        
        return cached.data;
    }
    
    clearCache(pattern = null) {
        if (pattern) {
            const regex = new RegExp(pattern);
            for (const key of this.cache.keys()) {
                if (regex.test(key)) {
                    this.cache.delete(key);
                }
            }
        } else {
            this.cache.clear();
        }
    }
    
    /**
     * Requêtes HTTP avec cache et retry
     */
    async fetchWithCache(url, options = {}, cacheKey = null, ttl = 5 * 60 * 1000) {
        if (cacheKey) {
            const cached = this.getCache(cacheKey);
            if (cached) {
                return cached;
            }
        }
        
        const result = await this.fetchWithRetry(url, options);
        
        if (cacheKey && result) {
            this.setCache(cacheKey, result, ttl);
        }
        
        return result;
    }
    
    /**
     * Requêtes HTTP avec retry automatique
     */
    async fetchWithRetry(url, options = {}, maxRetries = 3, retryDelay = 1000) {
        let lastError;
        
        for (let attempt = 1; attempt <= maxRetries; attempt++) {
            try {
                const response = await fetch(url, {
                    ...options,
                    headers: {
                        'Content-Type': 'application/json',
                        ...options.headers
                    }
                });
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                
                return await response.json();
                
            } catch (error) {
                lastError = error;
                
                if (attempt < maxRetries) {
                    console.warn(`Tentative ${attempt} échouée, nouvelle tentative dans ${retryDelay}ms:`, error);
                    await this.sleep(retryDelay);
                    retryDelay *= 2; // Backoff exponentiel
                }
            }
        }
        
        throw lastError;
    }
    
    /**
     * Attendre un délai
     */
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    /**
     * Copie dans le presse-papiers
     */
    async copyToClipboard(text) {
        try {
            if (navigator.clipboard) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback pour les navigateurs plus anciens
                const textArea = document.createElement('textarea');
                textArea.value = text;
                document.body.appendChild(textArea);
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                return true;
            }
        } catch (error) {
            console.error('Erreur lors de la copie:', error);
            return false;
        }
    }
    
    /**
     * Détection de la plateforme
     */
    isMobile() {
        return window.innerWidth <= 768;
    }
    
    isTablet() {
        return window.innerWidth > 768 && window.innerWidth <= 1024;
    }
    
    isDesktop() {
        return window.innerWidth > 1024;
    }
    
    /**
     * Détection du navigateur
     */
    getBrowserInfo() {
        const ua = navigator.userAgent;
        let browser = 'unknown';
        let version = 'unknown';
        
        if (ua.includes('Chrome')) {
            browser = 'Chrome';
            version = ua.match(/Chrome\/(\d+)/)?.[1] || 'unknown';
        } else if (ua.includes('Firefox')) {
            browser = 'Firefox';
            version = ua.match(/Firefox\/(\d+)/)?.[1] || 'unknown';
        } else if (ua.includes('Safari')) {
            browser = 'Safari';
            version = ua.match(/Version\/(\d+)/)?.[1] || 'unknown';
        } else if (ua.includes('Edge')) {
            browser = 'Edge';
            version = ua.match(/Edge\/(\d+)/)?.[1] || 'unknown';
        }
        
        return { browser, version };
    }
    
    /**
     * Formatage des tailles de fichier
     */
    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
    
    /**
     * Extraction d'URLs depuis un texte
     */
    extractUrls(text) {
        const urlRegex = /https?:\/\/[^\s]+/g;
        return text.match(urlRegex) || [];
    }
    
    /**
     * Conversion CSV vers JSON
     */
    csvToJson(csv) {
        const lines = csv.split('\n').filter(line => line.trim());
        if (lines.length < 2) return [];
        
        const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
        const result = [];
        
        for (let i = 1; i < lines.length; i++) {
            const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''));
            const obj = {};
            
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            
            result.push(obj);
        }
        
        return result;
    }
    
    /**
     * Export JSON vers fichier
     */
    downloadJson(data, filename = 'data.json') {
        const jsonString = JSON.stringify(data, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Export CSV depuis JSON
     */
    downloadCsv(data, filename = 'data.csv') {
        if (!data.length) return;
        
        const headers = Object.keys(data[0]);
        const csvContent = [
            headers.join(','),
            ...data.map(row => 
                headers.map(header => 
                    typeof row[header] === 'string' && row[header].includes(',') 
                        ? `"${row[header]}"` 
                        : row[header]
                ).join(',')
            )
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        
        URL.revokeObjectURL(url);
    }
    
    /**
     * Gestion des erreurs avec logging
     */
    logError(error, context = '') {
        const errorInfo = {
            message: error.message,
            stack: error.stack,
            context,
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent,
            url: window.location.href
        };
        
        console.error('🚨 Erreur:', errorInfo);
        
        // Ici, vous pourriez envoyer les erreurs à un service de monitoring
        // comme Sentry, LogRocket, etc.
        
        return errorInfo;
    }
    
    /**
     * Sanitisation HTML pour prévenir XSS
     */
    sanitizeHtml(html) {
        const div = document.createElement('div');
        div.textContent = html;
        return div.innerHTML;
    }
    
    /**
     * Validation de paramètres requis
     */
    requireParams(params, required) {
        const missing = required.filter(param => params[param] === undefined || params[param] === null);
        
        if (missing.length > 0) {
            throw new Error(`Paramètres requis manquants: ${missing.join(', ')}`);
        }
        
        return true;
    }
}

// Création de l'instance globale
window.Utils = new Utils();

// Export pour les modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}

console.log('🔧 Fonctions utilitaires chargées');