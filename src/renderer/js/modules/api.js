// Envoltura de peticiones y variables del bridge de Electron (preload)

export function getMacAddress() {
    return window.sapiusAPI.getMacAddress();
}

export async function getEnvUrls() {
    return await window.sapiusAPI.getEnvUrls();
}

export async function getBaseUrl() {
    return await window.sapiusAPI.getBaseUrl();
}

export async function apiGet(endpoint) {
    return await window.sapiusAPI.apiGet(endpoint);
}

export async function apiPost(endpoint, payload, isMultipart = false) {
    return await window.sapiusAPI.apiPost(endpoint, payload, isMultipart);
}

export function logToServer(msg, type = 'INFO') {
    window.sapiusAPI.logToServer(msg, type);
}

export function logout() {
    window.sapiusAPI.logout();
}

export async function getAppVersion() {
    return await window.sapiusAPI.getAppVersion();
}
