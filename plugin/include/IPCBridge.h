#pragma once
#include <string>
#include <functional>
#include <thread>
#include <atomic>

/**
 * @class IPCBridge
 * @brief Handles background asynchronous IPC communication with the Git-Music daemon on ws://127.0.0.1:4848.
 */
class IPCBridge {
public:
    using MessageCallback = std::function<void(const std::string& messageJson)>;

    IPCBridge(const std::string& daemonHost = "127.0.0.1", int port = 4848);
    ~IPCBridge();

    bool connect();
    void disconnect();
    bool isConnected() const;

    bool sendMessage(const std::string& type, const std::string& payloadJson);
    void setMessageCallback(MessageCallback callback);

private:
    std::string m_host;
    int m_port;
    std::atomic<bool> m_connected{false};
    std::atomic<bool> m_running{false};
    std::thread m_workerThread;
    MessageCallback m_callback;

    void workerLoop();
};
