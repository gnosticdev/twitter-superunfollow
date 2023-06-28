/** Types for the new chrome.sidePanel API  */
// GetPanelOptions
interface GetPanelOptions {
    tabId?: number
}
// PanelBehavior
interface PanelBehavior {
    openPanelOnActionClick?: boolean
}
// PanelOptions
interface PanelOptions {
    enabled?: boolean
    path?: string
    tabId?: number
}
// SidePanel
interface SidePanel {
    defaultPath?: string
}
// add these to the chrome namespace
// Methods

// getOptions
declare function getOptions(options: GetPanelOptions): Promise<PanelOptions>

// getPanelBehavior
declare function getPanelBehavior(): Promise<PanelBehavior>

// setOptions
declare function setOptions(options: PanelOptions): Promise<void>

// setPanelBehavior
declare function setPanelBehavior(behavior: PanelBehavior): Promise<void>
declare namespace chrome {
    namespace sidePanel {
        function getOptions(options: GetPanelOptions): Promise<PanelOptions>
        function getPanelBehavior(): Promise<PanelBehavior>
        function setOptions(options: PanelOptions): Promise<void>
        function setPanelBehavior(behavior: PanelBehavior): Promise<void>
    }
}
