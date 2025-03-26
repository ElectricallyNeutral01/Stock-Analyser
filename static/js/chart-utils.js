/**
 * Chart utility functions for the Stock Comparison Tool
 */

/**
 * Formats a date string from YYYY-MM-DD to a more readable format
 * @param {string} dateStr - Date string in YYYY-MM-DD format
 * @returns {string} Formatted date string
 */
function formatDateForDisplay(dateStr) {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric'
    });
}

/**
 * Formats a number as a currency string
 * @param {number} value - The number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted currency string
 */
function formatCurrency(value, decimals = 2) {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    }).format(value);
}

/**
 * Formats a large number with K, M, B suffixes
 * @param {number} num - The number to format
 * @returns {string} Formatted number string
 */
function formatLargeNumber(num) {
    if (num >= 1000000000) {
        return (num / 1000000000).toFixed(1) + 'B';
    }
    if (num >= 1000000) {
        return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
        return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
}

/**
 * Calculates the percentage change between two values
 * @param {number} oldValue - The original value
 * @param {number} newValue - The new value
 * @returns {string} Formatted percentage change
 */
function calculatePercentChange(oldValue, newValue) {
    const change = ((newValue - oldValue) / oldValue) * 100;
    return change.toFixed(2) + '%';
}

/**
 * Generates a gradient for chart backgrounds
 * @param {CanvasRenderingContext2D} ctx - Canvas context
 * @param {string} startColor - Starting color (rgba)
 * @param {string} endColor - Ending color (rgba)
 * @returns {CanvasGradient} Gradient for chart
 */
function createChartGradient(ctx, startColor, endColor) {
    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, startColor);
    gradient.addColorStop(1, endColor);
    return gradient;
}

/**
 * Generate chart colors for consistent styling
 * @param {number} index - Index of the dataset
 * @returns {Object} Object with borderColor and backgroundColor
 */
function getChartColors(index) {
    const colorSets = [
        {
            borderColor: 'rgba(75, 192, 192, 1)',
            backgroundColor: 'rgba(75, 192, 192, 0.2)'
        },
        {
            borderColor: 'rgba(255, 99, 132, 1)',
            backgroundColor: 'rgba(255, 99, 132, 0.2)'
        },
        {
            borderColor: 'rgba(54, 162, 235, 1)',
            backgroundColor: 'rgba(54, 162, 235, 0.2)'
        },
        {
            borderColor: 'rgba(255, 206, 86, 1)',
            backgroundColor: 'rgba(255, 206, 86, 0.2)'
        }
    ];
    
    return colorSets[index % colorSets.length];
}
