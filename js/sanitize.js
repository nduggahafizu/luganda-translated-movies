/* ===================================
   XSS Sanitization Utility
   Prevents Cross-Site Scripting attacks
   =================================== */

const Sanitize = (function() {
    'use strict';

    // HTML entities map for escaping
    const htmlEntities = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#x27;',
        '/': '&#x2F;',
        '`': '&#x60;',
        '=': '&#x3D;'
    };

    // Escape HTML special characters
    function escapeHtml(str) {
        if (str === null || str === undefined) return '';
        return String(str).replace(/[&<>"'`=\/]/g, char => htmlEntities[char]);
    }

    // Sanitize a string for safe HTML display
    function text(str) {
        return escapeHtml(str);
    }

    // Sanitize URL - only allow http, https, and relative URLs
    function url(str) {
        if (!str) return '';
        const trimmed = String(str).trim();
        
        // Allow relative URLs
        if (trimmed.startsWith('/') || trimmed.startsWith('./') || trimmed.startsWith('../')) {
            return encodeURI(trimmed);
        }
        
        // Only allow http and https protocols
        try {
            const parsed = new URL(trimmed);
            if (parsed.protocol === 'http:' || parsed.protocol === 'https:') {
                return parsed.href;
            }
        } catch (e) {
            // Invalid URL
        }
        
        return '';
    }

    // Sanitize for use in HTML attributes
    function attr(str) {
        return escapeHtml(str);
    }

    // Create safe HTML element with text content (not innerHTML)
    function createElement(tag, textContent, attributes = {}) {
        const el = document.createElement(tag);
        if (textContent) {
            el.textContent = textContent;
        }
        for (const [key, value] of Object.entries(attributes)) {
            if (key === 'class') {
                el.className = value;
            } else if (key === 'style') {
                el.style.cssText = value;
            } else if (key.startsWith('data-')) {
                el.setAttribute(key, escapeHtml(value));
            } else {
                el.setAttribute(key, escapeHtml(value));
            }
        }
        return el;
    }

    // Sanitize object properties for display
    function object(obj, allowedKeys = null) {
        if (!obj || typeof obj !== 'object') return {};
        
        const sanitized = {};
        const keys = allowedKeys || Object.keys(obj);
        
        for (const key of keys) {
            if (obj.hasOwnProperty(key)) {
                const value = obj[key];
                if (typeof value === 'string') {
                    sanitized[key] = escapeHtml(value);
                } else if (typeof value === 'number' || typeof value === 'boolean') {
                    sanitized[key] = value;
                } else if (value === null || value === undefined) {
                    sanitized[key] = '';
                }
            }
        }
        
        return sanitized;
    }

    // Build safe HTML string using template with escaped values
    function template(strings, ...values) {
        return strings.reduce((result, str, i) => {
            const value = values[i - 1];
            const escaped = (typeof value === 'string') ? escapeHtml(value) : value;
            return result + escaped + str;
        });
    }

    return {
        text,
        html: escapeHtml,
        url,
        attr,
        object,
        template,
        createElement,
        escapeHtml
    };
})();

// Export for use
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Sanitize;
}
