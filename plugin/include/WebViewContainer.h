#pragma once
#include <string>
#include <functional>
#include <memory>

#ifdef _WIN32
#include <windows.h>
#endif

/**
 * @class WebViewContainer
 * @brief Native OS window container hosting an embedded WebView2/Chromium UI inside VST3/CLAP host editor.
 */
class WebViewContainer {
public:
    using MessageCallback = std::function<void(const std::string& jsonMessage)>;

    WebViewContainer();
    ~WebViewContainer();

    /**
     * @brief Initialize embedded WebView attached to parent DAW HWND.
     * @param parentHwnd Native parent window handle from DAW (VST3/CLAP).
     * @param initialUrl URL or local file path to load (e.g. http://localhost:5173).
     * @param onMessage Callback invoked when JS sends a message to C++.
     */
    bool initialize(void* parentHwnd, const std::string& initialUrl, MessageCallback onMessage);

    /**
     * @brief Resize the embedded web view when the user resizes the plugin window in FL Studio / Ableton.
     */
    void setBounds(int x, int y, int width, int height);

    /**
     * @brief Send a JSON message from the C++ audio thread/bridge to the JavaScript cockpit UI.
     */
    void postMessageToJS(const std::string& jsonMessage);

    /**
     * @brief Navigate to a new URL or reload.
     */
    void navigate(const std::string& url);

    /**
     * @brief Close and clean up web view resources.
     */
    void shutdown();

    bool isInitialized() const { return m_isInitialized; }

private:
    void* m_parentHwnd = nullptr;
    std::string m_currentUrl;
    MessageCallback m_messageCallback;
    bool m_isInitialized = false;

    int m_width = 1200;
    int m_height = 800;

#ifdef _WIN32
    HWND m_childHwnd = nullptr;
#endif
};
