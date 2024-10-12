export function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

export function setupGlobalErrorHandler() {
    window.addEventListener('error', function(event) {
        console.error('Global error caught:', event.error);
        // Optionally, you can send this error to your server or a logging service
    });

    window.addEventListener('unhandledrejection', function(event) {
        console.error('Unhandled promise rejection:', event.reason);
        // Optionally, you can send this error to your server or a logging service
    });
}

export function rateLimiter(func, limit) {
    const queue = [];
    let ongoing = false;

    const dequeue = () => {
        if (queue.length > 0 && !ongoing) {
            ongoing = true;
            const { args, resolve } = queue.shift();
            Promise.resolve(func.apply(this, args))
                .then(resolve)
                .catch(resolve)
                .finally(() => {
                    ongoing = false;
                    setTimeout(dequeue, limit);
                });
        }
    };

    return function(...args) {
        return new Promise(resolve => {
            queue.push({ args, resolve });
            dequeue();
        });
    };
}
