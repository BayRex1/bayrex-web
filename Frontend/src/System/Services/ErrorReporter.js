class ErrorReporter {
    constructor() {
        this.wsClient = null;
    }

    setWebSocketClient(client) {
        this.wsClient = client;
    }

    async sendError(error, context = {}) {
        try {
            if (!this.wsClient) {
                return false;
            }

            const errorData = {
                message: error.message || 'Неизвестная ошибка',
                stack: error.stack,
                componentStack: context.componentStack,
                url: window.location.href,
                userAgent: navigator.userAgent,
                timestamp: new Date().toISOString(),
                context: context
            };

            await this.wsClient.send({
                type: 'system',
                action: 'report_error',
                payload: errorData
            });

            return true;
        } catch (sendError) {
            return false;
        }
    }

    async sendJSError(message, filename, lineno, colno, error) {
        return this.sendError(error || new Error(message), {
            filename,
            lineno,
            colno,
            type: 'javascript_error'
        });
    }

    async sendUnhandledRejection(reason) {
        const error = reason instanceof Error ? reason : new Error(String(reason));
        return this.sendError(error, {
            type: 'unhandled_rejection'
        });
    }

    async sendComponentError(error, errorInfo) {
        return this.sendError(error, {
            componentStack: errorInfo?.componentStack,
            type: 'component_error'
        });
    }
}

export const errorReporter = new ErrorReporter(); 
