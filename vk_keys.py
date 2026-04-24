def normalize_key(key):
    if len(key) == 1:
        return key.upper()
    return key


KEY_TO_VK = {
    # --- Navigation ---
    "ArrowUp": 0x26,
    "ArrowDown": 0x28,
    "ArrowLeft": 0x25,
    "ArrowRight": 0x27,
    "PageUp": 0x21,
    "PageDown": 0x22,
    "Home": 0x24,
    "End": 0x23,
    "Insert": 0x2D,
    "Delete": 0x2E,

    # --- Basic ---
    "Enter": 0x0D,
    "Escape": 0x1B,
    "Backspace": 0x08,
    "Tab": 0x09,
    " ": 0x20,

    # --- Modifiers ---
    "Shift": 0x10,
    "Control": 0x11,
    "Alt": 0x12,

    # --- Locks ---
    "CapsLock": 0x14,
    "NumLock": 0x90,
    "ScrollLock": 0x91,

    # --- Function keys ---
    **{f"F{i}": (0x70 + i - 1) for i in range(1, 25)},

    # --- Letters ---
    **{chr(c): c for c in range(65, 91)},  # A-Z

    # --- Numbers ---
    **{str(n): ord(str(n)) for n in range(10)},

    # --- Numpad ---
    "Numpad0": 0x60,
    "Numpad1": 0x61,
    "Numpad2": 0x62,
    "Numpad3": 0x63,
    "Numpad4": 0x64,
    "Numpad5": 0x65,
    "Numpad6": 0x66,
    "Numpad7": 0x67,
    "Numpad8": 0x68,
    "Numpad9": 0x69,
    "NumpadMultiply": 0x6A,
    "NumpadAdd": 0x6B,
    "NumpadSubtract": 0x6D,
    "NumpadDecimal": 0x6E,
    "NumpadDivide": 0x6F,

    # --- Symbols (US layout) ---
    ";": 0xBA,
    "=": 0xBB,
    ",": 0xBC,
    "-": 0xBD,
    ".": 0xBE,
    "/": 0xBF,
    "`": 0xC0,
    "[": 0xDB,
    "\\": 0xDC,
    "]": 0xDD,
    "'": 0xDE,

    # --- Media keys ---
    "MediaPlayPause": 0xB3,
    "MediaStop": 0xB2,
    "MediaTrackNext": 0xB0,
    "MediaTrackPrevious": 0xB1,

    # --- Volume ---
    "AudioVolumeMute": 0xAD,
    "AudioVolumeDown": 0xAE,
    "AudioVolumeUp": 0xAF,

    # --- Browser keys ---
    "BrowserBack": 0xA6,
    "BrowserForward": 0xA7,
    "BrowserRefresh": 0xA8,
    "BrowserStop": 0xA9,
    "BrowserSearch": 0xAA,
    "BrowserFavorites": 0xAB,
    "BrowserHome": 0xAC,

    # --- App launch ---
    "LaunchMail": 0xB4,
    "LaunchMediaPlayer": 0xB5,
    "LaunchApp1": 0xB6,
    "LaunchApp2": 0xB7,
}