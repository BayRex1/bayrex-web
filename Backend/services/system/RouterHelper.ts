class RouterHelper {
    static error(message) {
        return {
            status: 'error',
            message: message
        };
    }

    static success(data = {}) {
        return {
            status: 'success',
            ...data
        };
    }
}

export default RouterHelper;
