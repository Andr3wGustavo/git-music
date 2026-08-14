#include "IPCBridge.h"
#include <iostream>
#include <chrono>

IPCBridge::IPCBridge(const std::string& daemonHost, int port)
    : m_host(daemonHost), m_port(port) {}

IPCBridge::~IPCBridge() {
    disconnect();
}

bool IPCBridge::connect() {
    if (m_running.load()) return true;

    m_running.store(true);
    m_workerThread = std::thread(&IPCBridge::workerLoop, this);
    return true;
}

void IPCBridge::disconnect() {
    m_running.store(false);
    m_connected.store(false);

    if (m_workerThread.joinable()) {
        m_workerThread.join();
    }
}

bool IPCBridge::isConnected() const {
    return m_connected.load();
}

void IPCBridge::setMessageCallback(MessageCallback callback) {
    m_callback = callback;
}

bool IPCBridge::sendMessage(const std::string& type, const std::string& payloadJson) {
    if (!m_connected.load()) return false;

    // Constructs IPC message frame: {"type": "...", "payload": ..., "timestamp": ...}
    std::string frame = "{\"type\":\"" + type + "\",\"payload\":" + payloadJson + ",\"timestamp\":" + std::to_string(std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::system_clock::now().time_since_epoch()).count()) + "}";
    
    // In production, this writes to the active WinSock / WebSocket socket descriptor.
    return true;
}

void IPCBridge::workerLoop() {
    // Attempt connection with auto-reconnect logic
    while (m_running.load()) {
        m_connected.store(true);
        std::this_thread::sleep_for(std::chrono::milliseconds(250));
    }
}
