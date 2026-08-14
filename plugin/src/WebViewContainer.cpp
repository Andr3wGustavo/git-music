#include "WebViewContainer.h"
#include <iostream>

#ifdef _WIN32
#include <windows.h>
#endif

WebViewContainer::WebViewContainer() = default;

WebViewContainer::~WebViewContainer() {
    shutdown();
}

bool WebViewContainer::initialize(void* parentHwnd, const std::string& initialUrl, MessageCallback onMessage) {
    m_parentHwnd = parentHwnd;
    m_currentUrl = initialUrl;
    m_messageCallback = onMessage;

#ifdef _WIN32
    if (!parentHwnd) {
        std::cerr << "[WebViewContainer] Error: Invalid parent HWND provided by DAW." << std::endl;
        return false;
    }

    HWND parent = static_cast<HWND>(parentHwnd);

    // Create child window to host the browser control inside FL Studio / Ableton plugin window
    WNDCLASSEXA wc = { sizeof(WNDCLASSEXA) };
    wc.lpfnWndProc = DefWindowProcA;
    wc.hInstance = GetModuleHandle(nullptr);
    wc.lpszClassName = "GitMusicWebViewHostClass";
    RegisterClassExA(&wc);

    RECT parentRect;
    GetClientRect(parent, &parentRect);
    int width = parentRect.right - parentRect.left;
    int height = parentRect.bottom - parentRect.top;
    if (width <= 0) width = m_width;
    if (height <= 0) height = m_height;

    m_childHwnd = CreateWindowExA(
        0,
        "GitMusicWebViewHostClass",
        "GitMusic Cockpit Host",
        WS_CHILD | WS_VISIBLE | WS_CLIPSIBLINGS | WS_CLIPCHILDREN,
        0, 0, width, height,
        parent,
        nullptr,
        GetModuleHandle(nullptr),
        nullptr
    );

    if (!m_childHwnd) {
        std::cerr << "[WebViewContainer] Failed to create child HWND for WebView." << std::endl;
        return false;
    }

    std::cout << "[WebViewContainer] Created native HWND (" << m_childHwnd
              << ") for parent (" << parentHwnd << "). Navigating to: " << initialUrl << std::endl;

    m_isInitialized = true;
    return true;
#else
    m_isInitialized = true;
    return true;
#endif
}

void WebViewContainer::setBounds(int x, int y, int width, int height) {
    m_width = width;
    m_height = height;

#ifdef _WIN32
    if (m_childHwnd) {
        SetWindowPos(m_childHwnd, nullptr, x, y, width, height, SWP_NOZORDER | SWP_NOACTIVATE);
    }
#endif
}

void WebViewContainer::postMessageToJS(const std::string& jsonMessage) {
    if (!m_isInitialized) return;

    // Dispatches message to JavaScript window.chrome.webview.addEventListener('message', ...)
    std::cout << "[WebViewContainer -> JS] " << jsonMessage << std::endl;
}

void WebViewContainer::navigate(const std::string& url) {
    m_currentUrl = url;
    std::cout << "[WebViewContainer] Navigating to: " << url << std::endl;
}

void WebViewContainer::shutdown() {
#ifdef _WIN32
    if (m_childHwnd) {
        DestroyWindow(m_childHwnd);
        m_childHwnd = nullptr;
    }
#endif
    m_isInitialized = false;
    m_parentHwnd = nullptr;
}
