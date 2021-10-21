# AWS Analytics: Info & Changelog

_For a deeper technical writeup of analytics processes intended for developers, please see [aws-technical](aws-technical.md)._

Trezor Suite can be set to collect real-world data to improve the performance of both web and desktop apps. This anonymous data is only shared by users who have usage data tracking enabled.

Data tracking can be toggled on or off at any time through the Trezor Suite settings menu.

By default, analytics will be enabled immediately following the onboarding process, and the application will starts to track events and errors. Users are given the option to disable data collection before completing the onboarding.

## Anonymous data:

Collected data are anonymous. This means that **Suite does not track** personal information and can not be used to view particular users' balances.

Among the data **not collected** by analytics:

-   Device ids
-   Public keys
-   Particular amounts
-   Transaction ids

When data tracking is enabled, Trezor Suite collects functional information that can be used to directly improve the app, such as:

-   Events triggered by a user during a session
-   Hardware, operating system and setup of the connected device
-   Errors encountered during a session

## Changelog

This changelog lists all events that Suite tracks.

### 1.14

Fixed:

-   suite-ready
    -   osName: android is now correctly detected, added chromeos

### 1.13

Added:

-   switch-device/add-hidden-wallet

Changed:

-   wallet/created renamed to select-wallet-type

Removed:

-   desktop-init

### 1.12

Changed:

-   device-update-firmware
    -   toFwVersion and toBtcOnly made optional as we don't know them when installing custom firmware

Added:

-   guide/tooltip-link/navigation
    -   id: string

### 1.11

Added:

-   c_timestamp: number (time of created in ms sent with every event)
-   menu/settings/dropdown
    -   option: 'guide' (+ old ones)
-   menu/guide
-   guide/feedback/navigation
    -   type: 'overview' | 'bug' | 'suggestion'
-   guide/feedback/submit
    -   type: 'bug' | 'suggestion'
-   guide/header/navigation
    -   type: 'back' | 'close' | 'category'
    -   id?: string
-   guide/report
    -   type: 'overview' | 'bug' | 'suggestion'
-   guide/node/navigation
    -   type: 'category' | 'page'
    -   id: string

### 1.10

Removed:

-   initial-run-completed
    -   newDevice
    -   usedDevice

### 1.9

Changed:

-   use `stable.log` for codesign builds and `develop.log` otherwise
-   `suite-ready` is now also tracked on initial run

Added:

-   suite-ready
    -   platformLanguages: string
-   device-connect
    -   language: string
    -   model: string
-   settings/device/goto/background
    -   custom: boolean
-   settings/device/background
    -   image: string | undefined (gallery image)
    -   format: string | undefined (custom image)
    -   size: number | undefined (custom image)
    -   resolutionWidth: number | undefined (custom image)
    -   resolutionHeight: number | undefined (custom image)
-   add-token
    -   token: string
-   transaction-created
    -   action: 'sent' | 'copied' | 'downloaded' | 'replace'
    -   symbol: string
    -   tokens: string
    -   outputsCount: number
    -   broadcast: boolean
    -   bitcoinRbf: boolean
    -   bitcoinLockTime: boolean
    -   ethereumData: boolean
    -   rippleDestinationTag: boolean
    -   ethereumNonce: boolean
    -   selectedFee: string
-   menu/notifications/toggle
    -   value: boolean
-   menu/settings/toggle
    -   value: boolean
-   menu/settings/dropdown
    -   option: 'all' | 'general' | 'device' | 'coins'
-   menu/goto/tor
-   accounts/empty-account/receive

Fixed:

-   device-update-firmware
    -   toBtcOnly
-   accounts/empty-account/buy
    -   symbol (lowercase instead of uppercase)

### 1.8

Added:

-   settings/device/update-auto-lock
    -   value: string
-   suite-ready
    -   browserName: string
    -   browserVersion: string
    -   osName: string
    -   osVersion: string
    -   windowWidth: number
    -   windowHeight: number

Fixed:

-   suite-ready
    -   suiteVersion
    -   c_instance_id
    -   c_session_id
-   device-update-firmware
    -   fromFwVersion (changed separator to dots from commas)
    -   fromBlVersion (changed separator to dots from commas)
-   analytics/dispose

Removed:

-   menu/goto/exchange-index

Changed:

-   `desktop` build is now tracked to `stable.log` instead of `beta.log`

### 1.7

Added:

-   send-raw-transaction
    -   networkSymbol: string
-   device-connect
    -   totalDevices: number

### 1.6

Added:

-   suite-ready
    -   suiteVersion: string | ""
-   device-connect
    -   isBitcoinOnly: boolean
-   desktop-init
    -   desktopOSVersion: string | "" (in format: {platform}\_{release})
-   accounts/empty-account/buy
    -   symbol: string
-   account-create
    -   tokensCount: number
-   add-token
    -   networkSymbol: string
    -   addedNth: number

### 1.5

Added:

-   suite-ready
    -   theme (dark mode)
-   wallet/created
    -   type: standard | hidden
-   device-disconnect

### 1.4

Added:

-   suite-ready
    -   rememberedStandardWallets
    -   rememberedHiddenWallets
-   analytics/enable
-   analytics/dispose
-   check-seed/error
-   check-seed/success

### 1.3

Added:

-   device-connect
    -   backup_type
-   router/location-change
    -   prevRouterUrl
    -   nextRouterUrl

### 1.2

Added

-   suite-ready
    -   tor

### 1.1

Added:

-   device-update-firmware:
    -   toFwVersion
-   suite-ready
    -   platformLanguage
    -   platform
-   device-connect:
    -   totalInstances

### 1.0

-   initial version
